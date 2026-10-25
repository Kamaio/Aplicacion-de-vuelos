import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Vuelo {
    @PrimaryGeneratedColumn()
    id_vuelo: number;

    @Column()
    codigo_vuelo: string;

    @Column()
    tipo_vuelo: string; // 'Nacional' o 'Internacional'

    @Column()
    origen: string;

    @Column()
    destino: string;

    @Column()
    fecha_vuelo: string;

    @Column()
    hora_vuelo: string;

    @Column()
    hora_llegada: string;

    @Column()
    costo_economico: number;

    @Column()
    costo_primera: number;

    @Column()
    capacidad_total: number;

    @Column()
    estado: string; // 'Programado', 'Realizado', 'Cancelado'

    @Column()
    id_admin: number;

    @Column()
    reservas_total: number
    
    @Column()
    duracion: string

    @Column()
    fecha_llegada: string
}
