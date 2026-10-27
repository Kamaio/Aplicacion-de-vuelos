import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBilleteraDto } from './dto/create-billetera.dto';
import { UpdateBilleteraDto } from './dto/update-billetera.dto';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { Billetera } from './entities/billetera.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tarjeta } from './entities/tarjeta.entity';
import { Historial } from './entities/historial.entity';


@Injectable()
export class BilleteraService {
  constructor(
      @InjectRepository(Billetera)
      private readonly billeteraRepository: Repository<Billetera>,

      @InjectRepository(Tarjeta)
      private readonly tarjetaRepository: Repository<Tarjeta>,

      @InjectRepository(Historial)
      private readonly historialRepository: Repository<Historial>,
  
      private readonly dataSource: DataSource 
    ) {}


  async createTarjeta(createTarjetaDto: CreateTarjetaDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const nuevaTarjeta = queryRunner.manager.create(Tarjeta, {

        numero_tarjeta: createTarjetaDto.numeroTarjeta,
        tipo_tarjeta: createTarjetaDto.tipoTarjeta,
        franquicia: createTarjetaDto.franquicia,
        fecha_expiracion: createTarjetaDto.fechaExpiracion,
        id_billetera: createTarjetaDto.idBilletera
      })
      const tarjetaGuardada = await queryRunner.manager.save(nuevaTarjeta);

      await queryRunner.commitTransaction();

      return {
        message: 'Tarjeta creada exitosamente',
        usuario: this.mapTarjeta(tarjetaGuardada),
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
    const billetera = await this.billeteraRepository.findOne({
      where: { id_usuario: id},
      relations: { tarjetas: true}
    });

    return billetera ? this.mapBilletera(billetera) : null;
  }

  async findHistorial(id: number) {
    const billetera = await this.billeteraRepository.findOne({
      where: { id_usuario: id},
      relations: { historial: true }
    });

    return billetera ? this.mapBilletera(billetera) : null;
  }

  async updateSaldo(updateBilleteraDto: {idUsuario: number, monto: number, idTarjeta: number}) {
    const billetera = await this.billeteraRepository.findOne({
      where: { id_usuario: updateBilleteraDto.idUsuario}
    });

    if (!billetera) {
      throw new NotFoundException("Billetera con id de usuario ${id} no encontrada");
    }
    
    if (updateBilleteraDto.monto !== undefined) billetera.saldo += updateBilleteraDto.monto;

    await this.historialRepository.save({
      info_historial: `Se incremento el saldo de la billetera quedando un total de: ${billetera.saldo}`,
      fecha_transaccion: new Date(),
      id_billetera: billetera.id_billetera,
      monto: updateBilleteraDto.monto
    });

    await this.billeteraRepository.save(billetera);

    return this.mapBilletera(billetera);
  }

  async remove(idTarjeta: number, idUsuario: number) {
    const tarjeta = await this.tarjetaRepository.findOne({
      where: { 
        id_tarjeta: idTarjeta,
        billetera: { id_usuario: idUsuario }
      },
    });

    if (!tarjeta) {
      throw new NotFoundException(`Tarjeta con ID ${idTarjeta} no encontrada`);
    }

    await this.historialRepository.save({
      info_historial: `Se eliminó la tarjeta terminada en ${tarjeta.numero_tarjeta.slice(-4)}`,
      fecha_transaccion: new Date(),
      id_billetera: tarjeta.id_billetera,
      monto: 0
    });

    await this.tarjetaRepository.delete(idTarjeta);

    return { message: `Tarjeta con ID ${idTarjeta} eliminada permanentemente` };
  }

  private mapBilletera(billetera: Billetera) {
    return {
      id_billetera: billetera.id_billetera,
      id_usuario: billetera.id_usuario,
      saldo: billetera.saldo,
      tarjetas: billetera.tarjetas?.map(tarjeta => this.mapTarjeta(tarjeta)) ?? [],
      historial: billetera.historial?.map(historial => this.mapHistorial(historial)) ?? []
    };
  }

  private mapTarjeta(tarjeta: Tarjeta) {
    return {
      id_tarjeta: tarjeta.id_tarjeta,
      numero_tarjeta: tarjeta.numero_tarjeta,
      tipo_tarjeta: tarjeta.tipo_tarjeta,
      franquicia: tarjeta.franquicia,
      fecha_expiracion: tarjeta.fecha_expiracion
    };
  }

  private mapHistorial(historial: Historial) {
    return {
      id_historial: historial.id_historial,
      fecha_transaccion: historial.fecha_transaccion,
      info_historial: historial.info_historial,
      id_billetera: historial.id_billetera
    };
  }
}
