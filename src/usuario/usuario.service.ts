import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioCompletoDto } from './dto/create-usuario.dto';
import { CreateAdminDto } from './dto/createAdmin.dto';
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
        correo: createUsuarioCompletoDto.email,
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
        usuario: this.mapUsuario(usuarioGuardado),
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

  async createAdmin(createAdminDto: CreateAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      const saltRounds = 10;
      const contrasenaHasheada = await bcrypt.hash(createAdminDto.password, saltRounds);

      const nuevoUsuario = queryRunner.manager.create(Usuario, {

        usuario: createAdminDto.usuario,
        contrasena: contrasenaHasheada,
        correo: createAdminDto.email,
        rol: createAdminDto.rol,
        activo: true
      })
      const usuarioGuardado = await queryRunner.manager.save(nuevoUsuario);


      const nuevaInformacionPerfil = queryRunner.manager.create(InformacionPerfil, {
        usuario: usuarioGuardado,
        dni: createAdminDto.cc,
        //nombres: createAdminDto.nombres,
        //apellidos: createAdminDto.apellidos,
        //fecha_nacimiento: createAdminDto.fechaNacimiento,
        //lugar_nacimiento: createAdminDto.lugarNacimiento,
        //direccion_facturacion: createAdminDto.direccionFacturacion,
        //genero: createAdminDto.genero,
        //foto_url: createAdminDto.imagenUrl
      })
      const informacionGuardada = await queryRunner.manager.save(nuevaInformacionPerfil);

      await queryRunner.commitTransaction();

      return {
        message: 'Usuario creado exitosamente',
        usuario: this.mapUsuario(usuarioGuardado),
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

    return usuarios.map(usuario => this.mapUsuario(usuario));
  }

  async findAdministradores() {
    console.log("Buscando administradores activos...");
    const administradores = await this.usuarioRepository.find({
      where: { rol: 'ADMIN', activo: true },
      relations: { informacionPerfil: true }
    });

    return administradores.map(usuario => this.mapUsuario(usuario));
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id, activo: true },
      relations: { informacionPerfil: true }
    });

    return usuario ? this.mapUsuario(usuario) : null;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id, activo: true },
      relations: { informacionPerfil: true }
    });

    if (!usuario) {
      throw new NotFoundException("Usuario con id ${id} no encontrado");
    }

    // 1. Actualizar campos de la entidad principal 'Usuario'
    if (updateUsuarioDto.usuario !== undefined) usuario.usuario = updateUsuarioDto.usuario;
    if (updateUsuarioDto.email !== undefined) usuario.correo = updateUsuarioDto.email;
    if (updateUsuarioDto.rol !== undefined) usuario.rol = updateUsuarioDto.rol;
    
    if (updateUsuarioDto.password !== undefined && updateUsuarioDto.password.trim() !== '') {
      const saltRounds = 10;
      usuario.contrasena = await bcrypt.hash(updateUsuarioDto.password, saltRounds);
    }

    if (usuario.informacionPerfil) {
      if (updateUsuarioDto.cc !== undefined) usuario.informacionPerfil.dni = updateUsuarioDto.cc;
      if (updateUsuarioDto.nombres !== undefined) usuario.informacionPerfil.nombres = updateUsuarioDto.nombres;
      if (updateUsuarioDto.apellidos !== undefined) usuario.informacionPerfil.apellidos = updateUsuarioDto.apellidos;
      if (updateUsuarioDto.fechaNacimiento !== undefined) {
        usuario.informacionPerfil.fecha_nacimiento = updateUsuarioDto.fechaNacimiento;
      }
      if (updateUsuarioDto.lugarNacimiento !== undefined) {
        usuario.informacionPerfil.lugar_nacimiento = updateUsuarioDto.lugarNacimiento;
      }
      if (updateUsuarioDto.direccionFacturacion !== undefined) {
        usuario.informacionPerfil.direccion_facturacion = updateUsuarioDto.direccionFacturacion;
      }
      if (updateUsuarioDto.genero !== undefined) usuario.informacionPerfil.genero = updateUsuarioDto.genero;
      if (updateUsuarioDto.imagenUrl !== undefined) usuario.informacionPerfil.foto_url = updateUsuarioDto.imagenUrl;
    }

    await this.usuarioRepository.save(usuario);

    return this.mapUsuario(usuario);
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

  private mapUsuario(usuario: Usuario) {
    const perfil = usuario.informacionPerfil;

    return {
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      email: usuario.correo,
      rol: usuario.rol,
      cc: perfil?.dni,
      nombres: perfil?.nombres,
      apellidos: perfil?.apellidos,
      fechaNacimiento: perfil?.fecha_nacimiento,
      lugarNacimiento: perfil?.lugar_nacimiento,
      direccionFacturacion: perfil?.direccion_facturacion,
      genero: perfil?.genero,
      imagenUrl: perfil?.foto_url
    };
  }
}
