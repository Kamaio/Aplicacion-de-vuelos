import { Module } from '@nestjs/common';
import { CompraReservaService } from './compra-reserva.service';
import { CompraReservaController } from './compra-reserva.controller';

@Module({
  controllers: [CompraReservaController],
  providers: [CompraReservaService],
})
export class CompraReservaModule {}
