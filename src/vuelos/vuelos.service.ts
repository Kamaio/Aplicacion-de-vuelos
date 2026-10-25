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
    let tipo, capacidad, Llegada;

    if (internacional.includes(createVueloDto.destino)) {
      tipo = "Internacional";
      capacidad = 250;

      Llegada = this.calcularHoraLlegada(createVueloDto.fecha, createVueloDto.horaVuelo, createVueloDto.duracionVuelo, createVueloDto.destino);
    }
    else {
      tipo = "Nacional"; 
      capacidad = 150;
    
      Llegada = this.calcularHoraLlegada(createVueloDto.fecha, createVueloDto.horaVuelo, createVueloDto.duracionVuelo, createVueloDto.destino);
    }

    try {
      const nuevoVuelo = queryRunner.manager.create(Vuelo, {
        codigo_vuelo: createVueloDto.codigo,
        tipo_vuelo: tipo,
        origen: createVueloDto.origen,
        destino: createVueloDto.destino,
        fecha_vuelo: createVueloDto.fecha,
        hora_vuelo: createVueloDto.horaVuelo,
        hora_llegada: Llegada.horaLlegada,
        costo_economico: createVueloDto.precioEconomico,
        costo_primera: createVueloDto.precioPrimera,
        capacidad_total: capacidad,
        estado: "Programado",
        id_admin: id,
        reservas_total: 0,
        duracion: createVueloDto.duracionVuelo,
        fecha_llegada: Llegada.fechaLlegada
      })
      const vueloGuardado = await queryRunner.manager.save(nuevoVuelo);

      await queryRunner.commitTransaction();

      return {
        message: 'Vuelo creado exitosamente',
        vuelo: this.mapVuelos(vueloGuardado),
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
    return vuelos.map(vuelo => this.mapVuelos(vuelo));
  }

  async findProgramados() {
    const vuelosProgramados = await this.vueloRepository.find({
      where: { estado: 'Programado' },
    });
    return vuelosProgramados.map(vuelo => this.mapVuelos(vuelo));
  }

  async findOne(id: number) {
    const vuelo = await this.vueloRepository.findOne({
      where: { id_vuelo: id }
    });
    return vuelo ? this.mapVuelos(vuelo) : null;
  }

  update(id: number, updateVueloDto: UpdateVueloDto) {
    return `This action updates a #${id} vuelo`;
  }

  async remove(id: number) {
    const vuelo = await this.vueloRepository.findOne({where: {id_vuelo: id}});

    if (!vuelo) {
      throw new NotFoundException(`Vuelo con id ${id} no existe`);
    }

    if (vuelo.reservas_total !== 0 || vuelo.tipo_vuelo == "Realizado"){
      throw new NotFoundException(`Imposible de eliminar, vuelo con ${vuelo.reservas_total} reservas activas o ya realizado`)
    }

    //faltaria el devolverle el dinero al usuario

    vuelo.estado = "Cancelado";
    await this.vueloRepository.save(vuelo);
    return { message: `Vuelo con id ${id} cancelado exitosamente` };
  }

  private mapVuelos(vuelo: Vuelo) {
    return {
      idVuelo: vuelo.id_vuelo,
      codigoVuelo: vuelo.codigo_vuelo,
      tipoVuelo: vuelo.tipo_vuelo,
      origen: vuelo.origen,
      destino: vuelo.destino,
      fechaVuelo: vuelo.fecha_vuelo,
      horaVuelo: vuelo.hora_vuelo,
      horaLlegada: vuelo.hora_llegada,
      costoEconomico: vuelo.costo_economico,
      costoPrimera: vuelo.costo_primera,
      capacidadTotal: vuelo.capacidad_total,
      estado: vuelo.estado,
      idAdmin: vuelo.id_admin,
      reservasTotal: vuelo.reservas_total,
      duracion: vuelo.duracion,
      fechaLlegada: vuelo.fecha_llegada,
    };
  }

  calcularHoraLlegada(fechaStr: string, horaVueloStr: string, duracionStr: string, destino: string) {
    // Mapa de diferencia horaria en horas respecto a Colombia (UTC-5)
    const zonasHorarias: Record<string, number> = {
      "Miami (MIA)": 1,
      "Nueva York (NYC)": 1,
      "Buenos Aires (BUE)": 2,
      "Londres (LON)": 6,
      "Madrid (MAD)": 7,
    };

    // 1. Crear el objeto Date inicial de salida
    const salida = new Date(`${fechaStr}T${horaVueloStr}:00`);

    // 2. Obtener la duración en minutos
    const [horasDur, minsDur] = duracionStr.split(':').map(Number);
    const duracionMinutos = horasDur * 60 + minsDur;

    // 3. Obtener el desfase horario (si es nacional es 0)
    const diferenciaHoras = zonasHorarias[destino] || 0;
    const diferenciaMinutos = diferenciaHoras * 60;

    // 4. Sumar Duración + Zona Horaria a la fecha inicial
    const milisegundosTotales = (duracionMinutos + diferenciaMinutos) * 60 * 1000;
    const llegada = new Date(salida.getTime() + milisegundosTotales);

    // 5. Formatear la fecha ("YYYY-MM-DD") y hora ("HH:mm") resultantes
    const fechaLlegada = llegada.toISOString().split('T')[0];
    const horaLlegada = `${String(llegada.getHours()).padStart(2, '0')}:${String(llegada.getMinutes()).padStart(2, '0')}`;

    return {
      fechaLlegada,  // Ej: "2026-10-26"
      horaLlegada,   // Ej: "07:35"
    };
  }
}
