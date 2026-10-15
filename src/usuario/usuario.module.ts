import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './entities/usuario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformacionPerfil } from './entities/informacionPerfil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, InformacionPerfil])],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
