import { Module } from '@nestjs/common';
import { VuelosService } from './vuelos.service';
import { VuelosController } from './vuelos.controller';
import { Vuelo } from './entities/vuelo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Silla } from './entities/sillas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vuelo, Silla])],
  controllers: [VuelosController],
  providers: [VuelosService],
})
export class VuelosModule {}
