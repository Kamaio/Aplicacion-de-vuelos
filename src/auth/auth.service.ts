import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuario/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        private readonly jwtService: JwtService
    ) {}

    async login(loginDto: LoginDto) {
        const {correo, contrasena} = loginDto;

        const usuario = await this.usuarioRepository.findOne({ where: { correo, activo: true } });
        if (!usuario) { throw new UnauthorizedException('Correo no existente o usuario eliminado'); }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) { throw new UnauthorizedException('Contraseña incorrecta'); }

        const payLoad = { sub: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol };

        return {
            access_token: this.jwtService.sign(payLoad),

            usuario: {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                rol: usuario.rol,
            }
        };
        

    }


}
