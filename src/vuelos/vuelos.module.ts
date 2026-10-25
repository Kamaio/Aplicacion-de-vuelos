import { Module } from '@nestjs/common';
import { VuelosService } from './vuelos.service';
import { VuelosController } from './vuelos.controller';
import { Vuelo } from './entities/vuelo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Vuelo])],
  controllers: [VuelosController],
  providers: [VuelosService],
})
export class VuelosModule {}
