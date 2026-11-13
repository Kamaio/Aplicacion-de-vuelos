import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, QueryRunner } from 'typeorm';
import { CompraReserva } from './entities/compra-reserva.entity';
import { Silla } from '../vuelos/entities/sillas.entity';
import { Historial } from '../billetera/entities/historial.entity';
import { Billetera } from '../billetera/entities/billetera.entity';
import { Pasajero } from './entities/pasajero.entity';

@Injectable()
export class CompraReservaService {
  constructor(
    @InjectRepository(CompraReserva)
    private readonly compraReservaRepository: Repository<CompraReserva>,

    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,

    private readonly dataSource: DataSource,
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
          (reservaExistente.estado === 'Pendiente' &&
            createCompraReservaDto.estado === 'Pendiente')
        ) {
          throw new ConflictException(
            `Este usuario ya tiene una reserva o compra para este vuelo. Reserva existente: ${reservaExistente.estado}, Reserva nueva: ${createCompraReservaDto.estado}`,
          );
        }

        // PASAR DE 'Pendiente' A 'Pagado'
        if (
          reservaExistente.estado === 'Pendiente' &&
          createCompraReservaDto.estado === 'Pagado'
        ) {
          reservaExistente.estado = 'Pagado';
          reservaExistente.fecha_pago =
            createCompraReservaDto.fechaPago ?? new Date();
          reservaExistente.metodo_pago = createCompraReservaDto.metodoPago;
          reservaExistente.monto_total = createCompraReservaDto.montoTotal;

          const reservaActualizada =
            await queryRunner.manager.save(reservaExistente);

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

      // Saber si el vuelo es Internacional (250 sillas -> límite 50) o Nacional (150 sillas -> límite 25)
      const totalSillasVuelo = await queryRunner.manager.count(Silla, {
        where: { id_vuelo: createCompraReservaDto.idVuelo },
      });
      const limitePrimeraClase = totalSillasVuelo > 150 ? 50 : 25;

      // Verificar qué clase pidió el usuario ('PRIMERA_CLASE' vs 'ECONOMICA')
      const esPrimeraClase = createCompraReservaDto.clase
        ?.toUpperCase()
        .includes('PRIMERA');

      // Buscar todas las sillas DISPONIBLES de este vuelo
      const todasLasDisponibles = await queryRunner.manager.find(Silla, {
        where: {
          id_vuelo: createCompraReservaDto.idVuelo,
          estado: 'Disponible',
        },
      });

      // Filtrar SOLO las sillas que pertenecen al rango numérico de la clase solicitada
      const sillasDisponibles = todasLasDisponibles.filter((silla) => {
        const numeroSilla = this.obtenerNumeroCorrelativoSilla(
          silla.numero_silla,
        );
        if (esPrimeraClase) {
          // Del 1 al 25 (Nacional) o del 1 al 50 (Internacional)
          return numeroSilla >= 1 && numeroSilla <= limitePrimeraClase;
        }
        // Del 26 al 150 (Nacional) o del 51 al 250 (Internacional)
        return numeroSilla > limitePrimeraClase;
      });

      // Validar que existan suficientes sillas disponibles en esa clase
      if (sillasDisponibles.length < cantidadPasajeros) {
        const nombreClase = esPrimeraClase ? 'Primera Clase' : 'Económica';
        throw new BadRequestException(
          `No hay suficientes sillas disponibles en ${nombreClase}. Solicitadas: ${cantidadPasajeros}, Disponibles: ${sillasDisponibles.length}.`,
        );
      }

      // Seleccionar sillas aleatorias dentro de la clase correspondiente
      const sillasAleatorias = sillasDisponibles
        .sort(() => Math.random() - 0.5)
        .slice(0, cantidadPasajeros);

      const idsSillasAsignadas = sillasAleatorias.map((silla) => silla.id_silla);

      // Marcar esas sillas como 'Reservado' en la base de datos
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
        fecha_pago:
          createCompraReservaDto.fechaPago ??
          (createCompraReservaDto.estado === 'Pagado' ? new Date() : null),

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

  async findOne(id: number) {
    const reservas = await this.compraReservaRepository.find({
      where: { id_usuario: id },
      relations: {
        vuelo: true,
        pasajeros: true,
      },
    });

    const idsSillas = reservas
      .flatMap((r) => r.pasajeros || [])
      .map((p: any) => p.id_silla)
      .filter((idSilla) => Boolean(idSilla));

    const mapaSillas = new Map<number, Silla>();
    if (idsSillas.length > 0) {
      const sillasEncontradas = await this.dataSource
        .getRepository(Silla)
        .find({
          where: { id_silla: In(idsSillas) },
        });
      sillasEncontradas.forEach((s) => mapaSillas.set(s.id_silla, s));
    }

    return reservas.map((reserva) => this.mapReserva(reserva, mapaSillas));
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar la reserva con sus pasajeros y el vuelo asociado
      const reserva = await queryRunner.manager.findOne(CompraReserva, {
        where: { id_compra: id },
        relations: { 
          pasajeros: true,
          vuelo: true // Necesitamos los datos del vuelo para validar el tiempo
        },
      });

      if (!reserva) {
        throw new NotFoundException(`La reserva con ID ${id} no existe.`);
      }

      // 2. Validar que ningún pasajero haya realizado el check-in
      const pasajerosConCheckin = reserva.pasajeros?.filter(p => p.checkin_realizado);
      if (pasajerosConCheckin && pasajerosConCheckin.length > 0) {
        throw new BadRequestException(
          'No se puede cancelar la reserva porque uno o más pasajeros ya realizaron el check-in.'
        );
      }

      // 3. Validar el límite de tiempo (mínimo 1 hora antes del vuelo)
      if (reserva.vuelo) {
        // Concatenar fecha y hora del vuelo para crear un objeto Date
        const fechaHoraVuelo = new Date(`${reserva.vuelo.fecha_vuelo}T${reserva.vuelo.hora_vuelo}:00`);
        const ahora = new Date();
        
        // Calcular la diferencia en milisegundos
        const diferenciaMs = fechaHoraVuelo.getTime() - ahora.getTime();
        const horasFaltantes = diferenciaMs / (1000 * 60 * 60);

        if (horasFaltantes < 1 && reserva.estado === 'Pagado') {
          throw new BadRequestException(
            'Las compras solo pueden ser canceladas con al menos 1 hora de anticipación al vuelo.'
          );
        }
      }

      // 4. Liberar las sillas ocupadas por los pasajeros
      const idsSillas = reserva.pasajeros
        ?.map(p => p.id_silla)
        .filter(id => Boolean(id));

      if (idsSillas && idsSillas.length > 0) {
        await queryRunner.manager.update(
          Silla,
          { id_silla: In(idsSillas) },
          { estado: 'Disponible' } // Dejamos las sillas libres para otros usuarios
        );
      }

      // 5. Procesar el reembolso SOLO si el estado es 'Pagado'
      if (reserva.estado === 'Pagado') {
        const billetera = await queryRunner.manager.findOne(Billetera, {
          where: { id_usuario: reserva.id_usuario },
          lock: { mode: 'pessimistic_write' },
        });

        if (billetera) {
          // Devolver el dinero
          billetera.saldo += reserva.monto_total;
          await queryRunner.manager.save(billetera);

          // Registrar el reembolso en el historial
          const historial = queryRunner.manager.create(Historial, {
            info_historial: `Reembolso por cancelación de reserva ${reserva.codigo_reserva}. Saldo actual: ${billetera.saldo}`,
            fecha_transaccion: new Date(),
            id_billetera: billetera.id_billetera,
            monto: reserva.monto_total,
          });
          await queryRunner.manager.save(historial);
        }
      }

      // 6. Eliminar los pasajeros asociados a la reserva
      if (reserva.pasajeros && reserva.pasajeros.length > 0) {
        await queryRunner.manager.remove(reserva.pasajeros);
      }

      // 7. Eliminar físicamente la reserva
      await queryRunner.manager.remove(reserva);

      await queryRunner.commitTransaction();

      return { 
        message: reserva.estado === 'Pendiente'
          ? `Reserva con ID ${id} cancelada exitosamente. Las sillas han sido liberadas.`
          : `Compra con ID ${id} cancelada exitosamente. Se ha procesado el reembolso y liberado las sillas.`
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async actualizarSillaReserva(idReserva: number, idPasajero: number, idNuevaSilla: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar al pasajero (importando la entidad Pasajero de tu módulo correspondiente)
      const pasajero = await queryRunner.manager.findOne(Pasajero, {
        where: { 
          id_pasajero: idPasajero, 
          compraReserva: { id_compra: idReserva } 
        }
      });

      if (!pasajero) {
        throw new NotFoundException('No se encontró el pasajero asociado a esta reserva.');
      }

      // 2. Validar que NO haya hecho Check-in
      if (pasajero.checkin_realizado) {
        throw new BadRequestException('No se puede cambiar la silla porque el pasajero ya realizó el check-in.');
      }

      // 3. Validar si ya utilizó su único cambio de silla
      // Nota: Si en tu BD lo tienes como número (0 o 1), usa "pasajero.cambios_silla >= 1"
      if (pasajero.cambios_silla === 1) {
        throw new BadRequestException('El pasajero ya utilizó su único cambio de silla permitido.');
      }

      // 4. Verificar que la NUEVA silla exista y esté disponible
      const nuevaSilla = await queryRunner.manager.findOne(Silla, {
        where: { id_silla: idNuevaSilla },
      });

      if (!nuevaSilla) {
        throw new NotFoundException('La nueva silla seleccionada no existe.');
      }

      if (nuevaSilla.estado !== 'Disponible') {
        throw new BadRequestException('La silla seleccionada ya no está disponible.');
      }

      // 5. Liberar la silla ANTERIOR del pasajero
      if (pasajero.id_silla) {
        await queryRunner.manager.update(
          Silla, 
          { id_silla: pasajero.id_silla }, 
          { estado: 'Disponible' }
        );
      }

      // 6. Ocupar la NUEVA silla
      await queryRunner.manager.update(
        Silla, 
        { id_silla: idNuevaSilla }, 
        { estado: 'Reservado' } // o 'Asignado', dependiendo de tu CHECK de BD
      );

      // 7. Actualizar los datos del pasajero
      pasajero.id_silla = idNuevaSilla;
      // Actualizamos el atributo a 1
      pasajero.cambios_silla = 1; 

      const pasajeroActualizado = await queryRunner.manager.save(pasajero);

      await queryRunner.commitTransaction();

      return {
        message: 'Silla actualizada correctamente.',
        pasajero: pasajeroActualizado
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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
      cantidadPasajeros: pasajerosMapeados.length || 1,
      pasajeros: pasajerosMapeados,
      vuelo: reserva.vuelo || null,
    };
  }

  private async procesarPagoBilletera(
    queryRunner: QueryRunner,
    reserva: CompraReserva,
  ) {
    const billetera = await queryRunner.manager.findOne(Billetera, {
      where: { id_usuario: reserva.id_usuario },
      lock: { mode: 'pessimistic_write' },
    });

    if (!billetera) {
      throw new NotFoundException(
        'No se encontró la billetera del usuario que realiza la compra.',
      );
    }

    if (billetera.saldo < reserva.monto_total) {
      throw new BadRequestException(
        'Saldo insuficiente para realizar la compra.',
      );
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

  private obtenerNumeroCorrelativoSilla(codigoSilla: string): number {
    const limpio = String(codigoSilla).trim().toUpperCase();
    const match = limpio.match(/^(\d+)([A-F])$/);

    if (match) {
      const fila = parseInt(match[1], 10);
      const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
      const posicionLetra = letras.indexOf(match[2]) + 1;
      return (fila - 1) * 6 + posicionLetra;
    }

    return parseInt(limpio, 10) || 0;
  }
}