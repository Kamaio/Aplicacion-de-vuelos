import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { UpdateCompraReservaDto } from './dto/update-compra-reserva.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { CompraReserva } from './entities/compra-reserva.entity';
import { Silla } from '../vuelos/entities/sillas.entity';
import { Historial } from '../billetera/entities/historial.entity';
import { Billetera } from '../billetera/entities/billetera.entity';

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
    const reservaExistente = await this.compraReservaRepository.findOne({
      where: { id_vuelo: createCompraReservaDto.idVuelo, id_usuario: createCompraReservaDto.idUsuario }
    });

    if (reservaExistente) {
      throw new ConflictException('Este usuario ya tiene una reserva para este vuelo.');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cantidadPasajeros = createCompraReservaDto.pasajeros.length;

      // 2. Buscar todas las sillas DISPONIBLES de este vuelo
      const sillasDisponibles = await queryRunner.manager.find(Silla, {
        where: {
          id_vuelo: createCompraReservaDto.idVuelo,
          estado: 'Disponible',
        },
      });

      // 3. Validar que existan suficientes sillas para la cantidad de pasajeros
      if (sillasDisponibles.length < cantidadPasajeros) {
        throw new BadRequestException(
          `No hay suficientes sillas disponibles. Solicitadas: ${cantidadPasajeros}, Disponibles: ${sillasDisponibles.length}.`,
        );
      }

      // 4. Seleccionar sillas ALEATORIAS
      // Mezclamos el arreglo de sillas disponibles y tomamos exactamente la cantidad de pasajeros
      const sillasAleatorias = sillasDisponibles
        .sort(() => Math.random() - 0.5)
        .slice(0, cantidadPasajeros);

      // Obtener los IDs de las sillas seleccionadas al azar
      const idsSillasAsignadas = sillasAleatorias.map((silla) => silla.id_silla);

      // 5. Marcar esas sillas como 'Ocupada' en la base de datos
      await queryRunner.manager.update(
        Silla,
        { id_silla: In(idsSillasAsignadas) },
        { estado: 'Ocupada' },
      );


      const nuevoReserva = queryRunner.manager.create(CompraReserva, {
        codigo_reserva: createCompraReservaDto.codigoReserva,
        id_usuario: createCompraReservaDto.idUsuario,
        monto_total: createCompraReservaDto.montoTotal,
        estado: createCompraReservaDto.estado,
        metodo_pago: createCompraReservaDto.metodoPago,
        fecha_reserva: createCompraReservaDto.fechaReserva,
        fecha_limite_pago: createCompraReservaDto.fechaLimitePago ? createCompraReservaDto.fechaLimitePago : null,
        id_vuelo: createCompraReservaDto.idVuelo,
        fecha_pago: createCompraReservaDto.fechaPago ? createCompraReservaDto.fechaPago : null,

        pasajeros: createCompraReservaDto.pasajeros.map((pasajeroDto, index) => ({
          nombre: pasajeroDto.nombreCompleto,
          dni: pasajeroDto.documento,
          fecha_nacimiento: pasajeroDto.fechaNacimiento,
          genero: pasajeroDto.genero,
          telefono: pasajeroDto.telefono,
          correo: pasajeroDto.email,
          nombre_contacto: pasajeroDto.nombreContacto,
          telefono_contacto: pasajeroDto.telefonoContacto,
          id_silla: sillasAleatorias[index].id_silla, //silla asquerosa
          cambios_silla: 0,
          checkin_realizado: false,
        }))
      })
      const reservaGuardada = await queryRunner.manager.save(nuevoReserva);
      if (reservaGuardada.estado === 'Pagada') {
        const billetera = await queryRunner.manager.findOne(Billetera, {
          where: { id_usuario: reservaGuardada.id_usuario },
          lock: { mode: 'pessimistic_write' },
        });

        if (!billetera) {
          throw new NotFoundException('No se encontró la billetera del usuario que realiza la compra.');
        }

        if (billetera.saldo < reservaGuardada.monto_total) {
          throw new BadRequestException('Saldo insuficiente para realizar la compra.');
        }

        billetera.saldo -= reservaGuardada.monto_total;
        await queryRunner.manager.save(billetera);

        const historial = this.historialRepository.create({
          info_historial: `Compra de la reserva ${reservaGuardada.codigo_reserva} por ${reservaGuardada.monto_total}. Saldo restante: ${billetera.saldo}`,
          fecha_transaccion: new Date(),
          id_billetera: billetera.id_billetera,
          monto: -reservaGuardada.monto_total,
        });
        await queryRunner.manager.save(historial);
      }


      await queryRunner.commitTransaction();

      return {
        message: 'reserva creada exitosamente',
        vuelo: this.mapReserva(reservaGuardada)
      }
 
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }

    finally{
      await queryRunner.release();
    }

  }

  async findOne(id: number) {
    const reservas = await this.compraReservaRepository.find({
      where: { id_usuario: id },
      relations: {
        vuelo: true,
        pasajeros: true,
      },
    });

    return reservas.map(reserva => this.mapReserva(reserva));
}

  async remove(id: number) {
    await this.compraReservaRepository.delete(id);
    return { message: `Reserva con ID ${id} eliminada permanentemente` };
  }

  private mapReserva(reserva: CompraReserva) {
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
    };
  }
}
