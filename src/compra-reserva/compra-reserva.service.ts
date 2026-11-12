import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { CompraReserva } from './entities/compra-reserva.entity';
import { Silla } from '../vuelos/entities/sillas.entity';
import { Historial } from '../billetera/entities/historial.entity';
import { Billetera } from '../billetera/entities/billetera.entity';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';

@Injectable()
export class CompraReservaService {

  constructor(
    @InjectRepository(CompraReserva)
    private readonly compraReservaRepository: Repository<CompraReserva>,

    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
    
    private readonly dataSource: DataSource
  ) {}

  async create(createCompraReservaDto: CreateCompraReservaDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar dentro de la transacción si el usuario ya tiene un registro en este vuelo
      const reservaExistente = await queryRunner.manager.findOne(CompraReserva, {
        where: {
          id_vuelo: createCompraReservaDto.idVuelo,
          id_usuario: createCompraReservaDto.idUsuario,
        },
      });

      // 🛑 CASO A: YA EXISTE UNA RESERVA/COMPRA
      if (reservaExistente) {
        if (
          reservaExistente.estado === 'Pagado' ||
          (reservaExistente.estado === 'Pendiente' && createCompraReservaDto.estado === 'Pendiente')
        ) {
          throw new ConflictException(
            `Este usuario ya tiene una reserva o compra para este vuelo. Reserva existente: ${reservaExistente.estado}, Reserva nueva: ${createCompraReservaDto.estado}`
          );
        }

        // PASAR DE 'Pendiente' A 'Pagado'
        if (reservaExistente.estado === 'Pendiente' && createCompraReservaDto.estado === 'Pagado') {
          reservaExistente.estado = 'Pagado';
          reservaExistente.fecha_pago = createCompraReservaDto.fechaPago ?? new Date();
          reservaExistente.metodo_pago = createCompraReservaDto.metodoPago;
          reservaExistente.monto_total = createCompraReservaDto.montoTotal;

          const reservaActualizada = await queryRunner.manager.save(reservaExistente);

          await this.procesarPagoBilletera(queryRunner, reservaActualizada);

          await queryRunner.commitTransaction();

          return {
            message: 'Reserva pagada exitosamente',
            vuelo: this.mapReserva(reservaActualizada),
          };
        }
      }

      // 🟢 CASO B: NO EXISTE RESERVA (Creación desde cero)
      const cantidadPasajeros = createCompraReservaDto.pasajeros.length;

      // Buscar sillas disponibles
      const sillasDisponibles = await queryRunner.manager.find(Silla, {
        where: {
          id_vuelo: createCompraReservaDto.idVuelo,
          estado: 'Disponible',
        },
      });

      if (sillasDisponibles.length < cantidadPasajeros) {
        throw new BadRequestException(
          `No hay suficientes sillas disponibles. Solicitadas: ${cantidadPasajeros}, Disponibles: ${sillasDisponibles.length}.`,
        );
      }

      // Seleccionar sillas aleatorias
      const sillasAleatorias = sillasDisponibles
        .sort(() => Math.random() - 0.5)
        .slice(0, cantidadPasajeros);

      const idsSillasAsignadas = sillasAleatorias.map((silla) => silla.id_silla);

      // Marcar sillas como 'Reservado'
      await queryRunner.manager.update(
        Silla,
        { id_silla: In(idsSillasAsignadas) },
        { estado: 'Reservado' },
      );

      // Crear la nueva entidad CompraReserva con sus pasajeros
      const nuevaReserva = queryRunner.manager.create(CompraReserva, {
        codigo_reserva: createCompraReservaDto.codigoReserva,
        id_usuario: createCompraReservaDto.idUsuario,
        monto_total: createCompraReservaDto.montoTotal,
        estado: createCompraReservaDto.estado,
        metodo_pago: createCompraReservaDto.metodoPago,
        fecha_reserva: createCompraReservaDto.fechaReserva,
        fecha_limite_pago: createCompraReservaDto.fechaLimitePago ?? null,
        id_vuelo: createCompraReservaDto.idVuelo,
        fecha_pago: createCompraReservaDto.fechaPago ?? (createCompraReservaDto.estado === 'Pagado' ? new Date() : null),

        pasajeros: createCompraReservaDto.pasajeros.map((pasajeroDto, index) => ({
          nombre: pasajeroDto.nombreCompleto,
          dni: pasajeroDto.documento,
          fecha_nacimiento: pasajeroDto.fechaNacimiento,
          genero: pasajeroDto.genero,
          telefono: pasajeroDto.telefono,
          correo: pasajeroDto.email,
          nombre_contacto: pasajeroDto.nombreContacto,
          telefono_contacto: pasajeroDto.telefonoContacto,
          id_silla: sillasAleatorias[index].id_silla,
          cambios_silla: 0,
          checkin_realizado: false,
        })),
      });

      const reservaGuardada = await queryRunner.manager.save(nuevaReserva);

      if (reservaGuardada.estado === 'Pagado') {
        await this.procesarPagoBilletera(queryRunner, reservaGuardada);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Reserva creada exitosamente',
        vuelo: this.mapReserva(reservaGuardada),
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 🟢 CAMBIO 1: Consultar también las sillas reales de la BD para cruzar cada pasajero con su código de silla exacto
  async findOne(id: number) {
    const reservas = await this.compraReservaRepository.find({
      where: { id_usuario: id },
      relations: {
        vuelo: true,
        pasajeros: true,
      },
    });

    // Extraer todos los id_silla asignados a los pasajeros de estas reservas
    const idsSillas = reservas
      .flatMap((r) => r.pasajeros || [])
      .map((p: any) => p.id_silla)
      .filter((idSilla) => Boolean(idSilla));

    const mapaSillas = new Map<number, Silla>();
    if (idsSillas.length > 0) {
      const sillasEncontradas = await this.dataSource.getRepository(Silla).find({
        where: { id_silla: In(idsSillas) },
      });
      sillasEncontradas.forEach((s) => mapaSillas.set(s.id_silla, s));
    }

    return reservas.map((reserva) => this.mapReserva(reserva, mapaSillas));
  }

  async remove(id: number) {
    await this.compraReservaRepository.delete(id);
    return { message: `Reserva con ID ${id} eliminada permanentemente` };
  }

  // 🟢 CAMBIO 2: Incluir cantidadPasajeros, pasajeros (con su silla real) y vuelo en la respuesta
  private mapReserva(reserva: CompraReserva, mapaSillas?: Map<number, Silla>) {
    const pasajerosMapeados = (reserva.pasajeros || []).map((p: any) => {
      const sillaObj = mapaSillas?.get(p.id_silla);
      const codigoSilla =
        (sillaObj as any)?.numero_silla ||
        (sillaObj as any)?.numeroSilla ||
        (sillaObj as any)?.codigo ||
        (p.id_silla ? `Silla #${p.id_silla}` : '');

      return {
        idPasajero: p.id_pasajero,
        nombreCompleto: p.nombre,
        documento: p.dni,
        fechaNacimiento: p.fecha_nacimiento,
        genero: p.genero,
        telefono: p.telefono,
        email: p.correo,
        idSilla: p.id_silla,
        sillaActual: codigoSilla,
        cambiosSilla: p.cambios_silla,
        checkinRealizado: p.checkin_realizado,
      };
    });

    return {
      idReserva: reserva.id_compra,
      codigoReserva: reserva.codigo_reserva,
      estado: reserva.estado,
      fechaLimitePago: reserva.fecha_limite_pago,
      fechaReserva: reserva.fecha_reserva,
      fechaPago: reserva.fecha_pago,
      idUsuario: reserva.id_usuario,
      idVuelo: reserva.id_vuelo,
      metodoPago: reserva.metodo_pago,
      montoTotal: reserva.monto_total,
      cantidadPasajeros: pasajerosMapeados.length || 1, // 👈 Devuelve el número real de pasajeros
      pasajeros: pasajerosMapeados,                     // 👈 Devuelve los datos y silla real de cada uno
      vuelo: reserva.vuelo || null,                     // 👈 Devuelve el detalle real del vuelo
    };
  }

  private async procesarPagoBilletera(queryRunner: QueryRunner, reserva: CompraReserva) {
    const billetera = await queryRunner.manager.findOne(Billetera, {
      where: { id_usuario: reserva.id_usuario },
      lock: { mode: 'pessimistic_write' },
    });

    if (!billetera) {
      throw new NotFoundException('No se encontró la billetera del usuario que realiza la compra.');
    }

    if (billetera.saldo < reserva.monto_total) {
      throw new BadRequestException('Saldo insuficiente para realizar la compra.');
    }

    billetera.saldo -= reserva.monto_total;
    await queryRunner.manager.save(billetera);

    const historial = this.historialRepository.create({
      info_historial: `Compra de la reserva ${reserva.codigo_reserva} por ${reserva.monto_total}. Saldo restante: ${billetera.saldo}`,
      fecha_transaccion: new Date(),
      id_billetera: billetera.id_billetera,
      monto: -reserva.monto_total,
    });

    await queryRunner.manager.save(historial);
  }
}