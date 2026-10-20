import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!
    });
  }

  // Valida el token y expone req.user
  async validate(payload: { sub: number; correo: string; rol: string }) {
    const { sub: id_usuario } = payload;
    const usuario = await this.usuarioRepository.findOne({ where: { id_usuario, activo: true }});

    if (!usuario) {
      console.error(`Usuario con ID ${id_usuario} no encontrado o inactivo.`);
      throw new UnauthorizedException('Token no válido o usuario inexistente');
    }

    return {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }
}