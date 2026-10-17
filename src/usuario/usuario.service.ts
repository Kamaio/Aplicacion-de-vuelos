import { Injectable } from '@nestjs/common';
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
    return await this.usuarioRepository.find();
  }

  async findOne(id: number) {
    return await this.usuarioRepository.findOne({where: {id_usuario: id}});
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
