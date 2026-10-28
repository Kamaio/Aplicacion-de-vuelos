import { Injectable } from '@nestjs/common';
import { CreateCompraReservaDto } from './dto/create-compra-reserva.dto';
import { UpdateCompraReservaDto } from './dto/update-compra-reserva.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CompraReserva } from './entities/compra-reserva.entity';

@Injectable()
export class CompraReservaService {

  constructor(
    @InjectRepository(CompraReserva)
    private readonly compraReservaRepository: Repository<CompraReserva>,
    
    private readonly dataSource: DataSource
  ) {}



  async create(createCompraReservaDto: CreateCompraReservaDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevoReserva = queryRunner.manager.create(CompraReserva, {
        codigo_reserva: createCompraReservaDto.codigoReserva,
        id_usuario: createCompraReservaDto.idUsuario,
        monto_total: createCompraReservaDto.montoTotal,
        estado: createCompraReservaDto.estado,
        metodo_pago: createCompraReservaDto.metodoPago,
        fecha_reserva: createCompraReservaDto.fechaReserva,
        fecha_limite_pago: createCompraReservaDto.fechaLimitePago,
        id_vuelo: createCompraReservaDto.idVuelo,
        //fecha_pago:
      })
      const reservaGuardada = await queryRunner.manager.save(nuevoReserva);

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




    return 'This action adds a new compraReserva';
  }

  findAll() {
    return `This action returns all compraReserva`;
  }

  findOne(id: number) {
    return `This action returns a #${id} compraReserva`;
  }

  update(id: number, updateCompraReservaDto: UpdateCompraReservaDto) {
    return `This action updates a #${id} compraReserva`;
  }

  remove(id: number) {
    return `This action removes a #${id} compraReserva`;
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
