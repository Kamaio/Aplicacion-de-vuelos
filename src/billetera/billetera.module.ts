import { Module } from '@nestjs/common';
import { BilleteraService } from './billetera.service';
import { BilleteraController } from './billetera.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Billetera } from './entities/billetera.entity';
import { Tarjeta } from './entities/tarjeta.entity';
import { Historial } from './entities/historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Billetera, Tarjeta, Historial])],
  controllers: [BilleteraController],
  providers: [BilleteraService],
})
export class BilleteraModule {}
