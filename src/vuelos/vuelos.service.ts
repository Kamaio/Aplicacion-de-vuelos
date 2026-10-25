import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVueloDto } from './dto/create-vuelo.dto';
import { UpdateVueloDto } from './dto/update-vuelo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vuelo } from './entities/vuelo.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class VuelosService {
  
  constructor(
    @InjectRepository(Vuelo)
    private readonly vueloRepository: Repository<Vuelo>,
    
    private readonly dataSource: DataSource
  ) {}


  async create(id: number, createVueloDto: CreateVueloDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const internacional = ["Miami (MIA)", "Madrid (MAD)", "Londres (LON)", "Nueva York (NYC)", "Buenos Aires (BUE)"]
    let tipo, capacidad;

    if (internacional.includes(createVueloDto.destino)) {
      tipo = "Internacional";
      capacidad = 250;
    }
    else tipo = "Nacional"; capacidad = 150;

    try {
      const nuevoVuelo = queryRunner.manager.create(Vuelo, {
        codigo_vuelo: createVueloDto.codigo,
        tipo_vuelo: tipo,
        origen: createVueloDto.origen,
        destino: createVueloDto.destino,
        fecha_vuelo: createVueloDto.fecha,
        hora_vuelo: createVueloDto.horaVuelo,
        hora_llegada: createVueloDto.horaLlegada,
        costo_economico: createVueloDto.precioEconomico,
        costo_primera: createVueloDto.precioPrimera,
        capacidad_total: capacidad,
        estado: "Programado",
        id_admin: id
      })
      const vueloGuardado = queryRunner.manager.save(nuevoVuelo);

      await queryRunner.commitTransaction();

      return {
        message: 'Vuelo creado exitosamente',
        //vuelo: this.mapVuelo(vueloGuardado),
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
      
    }

    finally{
      await queryRunner.release();
    }
  }

  async findAll() {
    const vuelos = await this.vueloRepository.find();
    return vuelos;
  }

  async findProgramados() {
    const vuelosProgramados = await this.vueloRepository.find({
      where: { estado: 'Programado' },
    });
    return vuelosProgramados;
  }

  async findOne(id: number) {
    const vuelo = await this.vueloRepository.findOne({
      where: { id_vuelo: id }
    });
    return vuelo;
  }

  update(id: number, updateVueloDto: UpdateVueloDto) {
    return `This action updates a #${id} vuelo`;
  }

  async remove(id: number) { //esto esta mal porque debo revisar que no hayan ni voletos vendidos ni que ya sea la hora del vuelo es provicional nomas
    const vuelo = await this.vueloRepository.findOne({where: {id_vuelo: id}});

    if (!vuelo) {
      throw new NotFoundException(`Vuelo con id ${id} no existe`);
    }


    vuelo.estado = "Cancelado";
    await this.vueloRepository.save(vuelo);
    return { message: `Vuelo con id ${id} cancelado exitosamente` };
  }

  mapVuelos(Vuelo: Vuelo) {

    //aca se pone el mapeo cuando tenga el perro hp dto si es que algun dia lo fucking hago omfg

  }
}
