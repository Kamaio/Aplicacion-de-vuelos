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
        const { email, contrasena } = loginDto;

        const usuario = await this.usuarioRepository.findOne({ where: { correo: email, activo: true } });
        if (!usuario) { 
            console.error(`Usuario con correo ${email} no encontrado o inactivo.`);
            throw new UnauthorizedException('Correo no existente o usuario eliminado'); }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) { 
            console.error(`Contraseña incorrecta para el usuario con correo ${email} (${contrasena} y ${usuario.contrasena}).`);
            throw new UnauthorizedException('Contraseña incorrecta'); }

        const payLoad = { sub: usuario.id_usuario, correo: usuario.correo, rol: usuario.rol };

        return {
            access_token: this.jwtService.sign(payLoad),

            usuario: {
                id_usuario: usuario.id_usuario,
                email: usuario.correo,
                rol: usuario.rol,
            }
        };
        

    }


}
