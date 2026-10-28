import { Module } from '@nestjs/common';
import { CompraReservaService } from './compra-reserva.service';
import { CompraReservaController } from './compra-reserva.controller';
import { CompraReserva } from './entities/compra-reserva.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CompraReserva])],
  controllers: [CompraReservaController],
  providers: [CompraReservaService],
})
export class CompraReservaModule {}
