import { Module } from '@nestjs/common';
import { CompraReservaService } from './compra-reserva.service';
import { CompraReservaController } from './compra-reserva.controller';
import { CompraReserva } from './entities/compra-reserva.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pasajero } from './entities/pasajero.entity';
import { Historial } from '../billetera/entities/historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompraReserva, Pasajero, Historial])],
  controllers: [CompraReservaController],
  providers: [CompraReservaService],
})
export class CompraReservaModule {}
