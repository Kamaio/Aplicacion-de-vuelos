import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioCompletoDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { DataSource, Repository } from 'typeorm';
import { InformacionPerfil } from './entities/informacionPerfil.entity';

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
      const nuevoUsuario = queryRunner.manager.create(Usuario, {

        usuario: createUsuarioCompletoDto.usuario,
        contrasena: createUsuarioCompletoDto.contrasena,
        correo: createUsuarioCompletoDto.correo,
        rol: createUsuarioCompletoDto.rol,
        activo: true
      })
      const usuarioGuardado = await queryRunner.manager.save(nuevoUsuario);


      const nuevaInformacionPerfil = queryRunner.manager.create(InformacionPerfil, {
        id_usuario: usuarioGuardado.id_usuario,
        dni: createUsuarioCompletoDto.dni,
        nombres: createUsuarioCompletoDto.nombres,
        apellidos: createUsuarioCompletoDto.apellidos,
        fecha_nacimiento: createUsuarioCompletoDto.fecha_nacimiento,
        lugar_nacimiento: createUsuarioCompletoDto.lugar_nacimiento,
        direccion_facturacion: createUsuarioCompletoDto.direccion_facturacion,
        genero: createUsuarioCompletoDto.genero,
        foto_url: createUsuarioCompletoDto.foto_url
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
    return await this.usuarioRepository.find({where: {activo: true}, relations: {informacionPerfil: true}});
  }

  async findOne(id: number) {
    return await this.usuarioRepository.findOne({where: {id_usuario: id, activo: true}, relations: {informacionPerfil: true}});
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({where: {id_usuario: id, activo: true}, relations: {informacionPerfil: true}});
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    const { usuario: nombreUsuario, contrasena, correo, rol, ...datosPerfil } = updateUsuarioDto as any;

    const nuevoUsuario: Partial<Usuario> = {};
    if (nombreUsuario != undefined) nuevoUsuario.usuario = nombreUsuario;
    if (contrasena != undefined) nuevoUsuario.contrasena = contrasena;
    if (correo != undefined) nuevoUsuario.correo = correo;
    if (rol != undefined) nuevoUsuario.rol = rol;

    Object.assign(usuario, nuevoUsuario);

    // 4. Actualizar campos de InformacionPerfil si existen cambios enviados
    if (usuario.informacionPerfil && Object.keys(datosPerfil).length > 0) {
      Object.assign(usuario.informacionPerfil, datosPerfil);
    }

    // 5. Un solo save actualiza AMBAS tablas en la base de datos gracias a cascade
    await this.usuarioRepository.save(usuario);

  return { message: `Usuario con id ${id} actualizado exitosamente` };
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
