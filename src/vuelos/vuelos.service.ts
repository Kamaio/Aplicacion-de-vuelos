import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVueloDto } from './dto/create-vuelo.dto';
import { UpdateVueloDto } from './dto/update-vuelo.dto';
import { BusquedaParametrizadaDto } from './dto/busquedaParametrizada.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vuelo } from './entities/vuelo.entity';
import { DataSource, Repository } from 'typeorm';
import { Silla } from './entities/sillas.entity';

@Injectable()
export class VuelosService {
  
  constructor(
    @InjectRepository(Vuelo)
    private readonly vueloRepository: Repository<Vuelo>,
    @InjectRepository(Silla)
    private readonly sillaRepository: Repository<Silla>,
    private readonly dataSource: DataSource
  ) {}

  async create(id: number, createVueloDto: CreateVueloDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const internacional = ["Miami (MIA)", "Madrid (MAD)", "Londres (LON)", "Nueva York (NYC)", "Buenos Aires (BUE)"];
    let tipo, capacidad, Llegada;

    if (internacional.includes(createVueloDto.destino)) {
      tipo = "Internacional";
      capacidad = 250;
      Llegada = this.calcularHoraLlegada(createVueloDto.fecha, createVueloDto.horaVuelo, createVueloDto.duracionVuelo, createVueloDto.destino);
    } else {
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
      });
      const vueloGuardado = await queryRunner.manager.save(nuevoVuelo);

      const sillas = this.generarEstructuraSillas(capacidad);

      const sillasParaInsertar = sillas.map(silla => ({
        ...silla,
        id_vuelo: vueloGuardado.id_vuelo,
      }));

      await queryRunner.manager.insert(Silla, sillasParaInsertar);

      await queryRunner.commitTransaction();

      return {
        message: 'Vuelo creado exitosamente',
        vuelo: this.mapVuelos(vueloGuardado, 0),
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    const vuelos = await this.vueloRepository.find();
    const mapaConteos = await this.obtenerMapaConteoReservas();

    return vuelos.map(vuelo =>
      this.mapVuelos(vuelo, mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0)
    );
  }

  async findProgramados() {
    const vuelosProgramados = await this.vueloRepository.find({
      where: { estado: 'Programado' },
    });
    const mapaConteos = await this.obtenerMapaConteoReservas();

    return vuelosProgramados.map(vuelo =>
      this.mapVuelos(vuelo, mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0)
    );
  }

  async findParametrizada(busquedaParametrizadaDto: BusquedaParametrizadaDto) {
    const { origen, destino, fecha, precioMaximo } = busquedaParametrizadaDto;

    const query = this.vueloRepository.createQueryBuilder('vuelo').where('vuelo.estado = :estado', { estado: 'Programado' });

    if (origen) {
      query.andWhere('vuelo.origen = :origen', { origen });
    }

    if (destino) {
      query.andWhere('vuelo.destino = :destino', { destino });
    }

    if (fecha) {
      query.andWhere('vuelo.fecha_vuelo = :fecha', { fecha });
    }

    if (precioMaximo) {
      query.andWhere('vuelo.costo_economico <= :precioMaximo', { precioMaximo });
    }

    const vuelosProgramados = await query.getMany();
    const mapaConteos = await this.obtenerMapaConteoReservas();

    return vuelosProgramados.map((vuelo) =>
      this.mapVuelos(vuelo, mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0)
    );
  }

  async findOne(id: number) {
    const vuelo = await this.vueloRepository.findOne({
      where: { id_vuelo: id }
    });
    if (!vuelo) return null;

    const mapaConteos = await this.obtenerMapaConteoReservas();
    return this.mapVuelos(vuelo, mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0);
  }

  async update(id: number, updateVueloDto: UpdateVueloDto) {
    const vuelo = await this.vueloRepository.findOne({ where: { id_vuelo: id } });

    if (!vuelo) {
      throw new NotFoundException(`Vuelo con id ${id} no encontrado`);
    }

    if (updateVueloDto.fecha !== undefined) vuelo.fecha_vuelo = updateVueloDto.fecha;
    if (updateVueloDto.horaVuelo !== undefined) vuelo.hora_vuelo = updateVueloDto.horaVuelo;
    if (updateVueloDto.precioEconomico !== undefined) vuelo.costo_economico = updateVueloDto.precioEconomico;
    if (updateVueloDto.precioPrimera !== undefined) vuelo.costo_primera = updateVueloDto.precioPrimera;

    const llegada = this.calcularHoraLlegada(vuelo.fecha_vuelo, vuelo.hora_vuelo, vuelo.duracion, vuelo.destino);
    vuelo.fecha_llegada = llegada.fechaLlegada;
    vuelo.hora_llegada = llegada.horaLlegada;

    await this.vueloRepository.save(vuelo);

    const mapaConteos = await this.obtenerMapaConteoReservas();
    return this.mapVuelos(vuelo, mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0);
  }

  async remove(id: number) {
    const vuelo = await this.vueloRepository.findOne({ where: { id_vuelo: id } });

    if (!vuelo) {
      throw new NotFoundException(`Vuelo con id ${id} no existe`);
    }

    const mapaConteos = await this.obtenerMapaConteoReservas();
    const reservasReales = mapaConteos.get(vuelo.id_vuelo) ?? vuelo.reservas_total ?? 0;

    if (reservasReales !== 0 || vuelo.estado === 'Realizado') {
      throw new NotFoundException(`Imposible de eliminar, vuelo con ${reservasReales} reservas activas o ya realizado`);
    }

    vuelo.estado = 'Cancelado';
    await this.vueloRepository.save(vuelo);
    return { message: `Vuelo con id ${id} cancelado exitosamente` };
  }

  private async obtenerMapaConteoReservas() {
    const mapa = new Map();
    try {
      const metadata = this.dataSource.entityMetadatas.find(
        (m) => m.name === 'CompraReserva' || m.tableName.includes('compra') || m.tableName.includes('reserva')
      );

      if (!metadata) return mapa;

      const conteos = await this.dataSource
        .createQueryBuilder()
        .select('r.id_vuelo', 'idVuelo')
        .addSelect('COUNT(*)', 'total')
        .from(metadata.tableName, 'r')
        .where("LOWER(r.estado) != 'cancelado'")
        .groupBy('r.id_vuelo')
        .getRawMany();

      conteos.forEach((c) => {
        mapa.set(Number(c.idVuelo), Number(c.total));
      });
      return mapa;
    } catch (error) {
      console.warn('No se pudo calcular el conteo dinámico de reservas:', error);
      return mapa;
    }
  }

  private mapVuelos(vuelo: Vuelo, reservasReales?: number) {
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
      reservasTotal: reservasReales !== undefined ? reservasReales : vuelo.reservas_total,
      duracion: vuelo.duracion,
      fechaLlegada: vuelo.fecha_llegada,
    };
  }

  calcularHoraLlegada(fechaStr: string, horaVueloStr: string, duracionStr: string, destino: string) {
    const zonasHorarias: Record<string, number> = {
      "Miami (MIA)": 1,
      "Nueva York (NYC)": 1,
      "Buenos Aires (BUE)": 2,
      "Londres (LON)": 6,
      "Madrid (MAD)": 7,
    };

    const salida = new Date(`${fechaStr}T${horaVueloStr}:00`);
    const [horasDur, minsDur] = duracionStr.split(':').map(Number);
    const duracionMinutos = horasDur * 60 + minsDur;
    const diferenciaHoras = zonasHorarias[destino] || 0;
    const diferenciaMinutos = diferenciaHoras * 60;
    const milisegundosTotales = (duracionMinutos + diferenciaMinutos) * 60 * 1000;
    const llegada = new Date(salida.getTime() + milisegundosTotales);

    const fechaLlegada = llegada.toISOString().split('T')[0];
    const horaLlegada = `${String(llegada.getHours()).padStart(2, '0')}:${String(llegada.getMinutes()).padStart(2, '0')}`;

    return {
      fechaLlegada,
      horaLlegada,
    };
  }

  private generarEstructuraSillas(capacidadTotal: number) {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
    const sillasGeneradas = [];

    let fila = 1;
    let letraIndex = 0;

    for (let i = 0; i < capacidadTotal; i++) {
      const numeroSilla = `${fila}${letras[letraIndex]}`;
      const clase = fila <= 2 ? 'Primera' : 'Económica';

      sillasGeneradas.push({
        numero_silla: numeroSilla,
        clase: clase,
        estado: 'Disponible',
      });

      letraIndex++;
      if (letraIndex >= letras.length) {
        letraIndex = 0;
        fila++;
      }
    }

    return sillasGeneradas;
  }
}