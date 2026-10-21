import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioCompletoDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { DataSource, Repository } from 'typeorm';
import { InformacionPerfil } from './entities/informacionPerfil.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly dataSource: DataSource 
  ) {}


  async create(createUsuarioCompletoDto: CreateUsuarioCompletoDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      const saltRounds = 10;
      const contrasenaHasheada = await bcrypt.hash(createUsuarioCompletoDto.password, saltRounds);

      const nuevoUsuario = queryRunner.manager.create(Usuario, {

        usuario: createUsuarioCompletoDto.usuario,
        contrasena: contrasenaHasheada,
        correo: createUsuarioCompletoDto.correo,
        rol: createUsuarioCompletoDto.rol,
        activo: true
      })
      const usuarioGuardado = await queryRunner.manager.save(nuevoUsuario);


      const nuevaInformacionPerfil = queryRunner.manager.create(InformacionPerfil, {
        usuario: usuarioGuardado,
        dni: createUsuarioCompletoDto.cc,
        nombres: createUsuarioCompletoDto.nombres,
        apellidos: createUsuarioCompletoDto.apellidos,
        fecha_nacimiento: createUsuarioCompletoDto.fechaNacimiento,
        lugar_nacimiento: createUsuarioCompletoDto.lugarNacimiento,
        direccion_facturacion: createUsuarioCompletoDto.direccionFacturacion,
        genero: createUsuarioCompletoDto.genero,
        foto_url: createUsuarioCompletoDto.imagenUrl
      })
      const informacionGuardada = await queryRunner.manager.save(nuevaInformacionPerfil);

      await queryRunner.commitTransaction();

      return {
        message: 'Usuario creado exitosamente',
        usuario: usuarioGuardado,
        informacionPerfil: informacionGuardada
      }
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally{
      await queryRunner.release();
    }
  }

  async findAll() {
    const usuarios = await this.usuarioRepository.find({
      where: { activo: true }, 
      relations: { informacionPerfil: true }
    });

    return usuarios.map(usuario => ({
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      cc: usuario.informacionPerfil?.dni,
      nombres: usuario.informacionPerfil?.nombres,
      apellidos: usuario.informacionPerfil?.apellidos,
      fechaNacimiento: usuario.informacionPerfil?.fecha_nacimiento,
      lugarNacimiento: usuario.informacionPerfil?.lugar_nacimiento,
      genero: usuario.informacionPerfil?.genero,
      direccionFacturacion: usuario.informacionPerfil?.direccion_facturacion
    }));
  }

  async findAdministradores() {
    console.log("Buscando administradores activos...");
    return await this.usuarioRepository.find({where: {rol: 'ADMIN', activo: true}, relations: {informacionPerfil: true}});
  }

  async findOne(id: number) {
    return await this.usuarioRepository.findOne({where: {id_usuario: id, activo: true}, relations: {informacionPerfil: true}});
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id, activo: true },
      relations: { informacionPerfil: true }
    });

    if (!usuario) {
      throw new NotFoundException("Usuario con id ${id} no encontrado");
    }

    const dto = updateUsuarioDto as any;

    // 1. Actualizar campos de la entidad principal 'Usuario'
    if (dto.usuario !== undefined) usuario.usuario = dto.usuario;
    if (dto.correo !== undefined) usuario.correo = dto.correo;
    if (dto.rol !== undefined) usuario.rol = dto.rol;
    
    if (dto.contrasena !== undefined && dto.contrasena.trim() !== '') {
      const saltRounds = 10;
      usuario.contrasena = await bcrypt.hash(dto.contrasena, saltRounds);
    }

    // 2. Extraer datos del perfil (ya sea si vienen anidados en informacionPerfil o planos)
    const perfilData = dto.informacionPerfil || dto;

    if (usuario.informacionPerfil) {
      if (perfilData.direccion_facturacion !== undefined) {
        usuario.informacionPerfil.direccion_facturacion = perfilData.direccion_facturacion;
      } else if (perfilData.direccionFacturacion !== undefined) {
        usuario.informacionPerfil.direccion_facturacion = perfilData.direccionFacturacion;
      }

      if (perfilData.foto_url !== undefined) {
        usuario.informacionPerfil.foto_url = perfilData.foto_url;
      } else if (perfilData.imagenUrl !== undefined) {
        usuario.informacionPerfil.foto_url = perfilData.imagenUrl;
      }

      if (perfilData.dni !== undefined) usuario.informacionPerfil.dni = perfilData.dni;
      if (perfilData.nombres !== undefined) usuario.informacionPerfil.nombres = perfilData.nombres;
      if (perfilData.apellidos !== undefined) usuario.informacionPerfil.apellidos = perfilData.apellidos;
    }

    // 3. Guardar la entidad (gracias a cascade: true actualizará ambas tablas en PostgreSQL)
    await this.usuarioRepository.save(usuario);

    // 4. Retornar el usuario actualizado completo para que Angular refresque la UI inmediatamente
    console.log("Usuario actualizado:", usuario);
    return usuario;
  }

  async remove(id: number) {
    const usuario = await this.usuarioRepository.findOne({where: {id_usuario: id, activo: true}}); //seria medio marica eliminar un usuario que ya esta eliminado pero pues ahi se lo puse
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    usuario.activo = false;
    await this.usuarioRepository.save(usuario);
    return { message: `Usuario con id ${id} eliminado exitosamente` };
  }
}
