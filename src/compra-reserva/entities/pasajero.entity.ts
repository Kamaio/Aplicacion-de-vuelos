import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CompraReserva } from "./compra-reserva.entity";

@Entity('pasajero')
export class Pasajero {
    @PrimaryGeneratedColumn()
    id_pasajero: number

    @Column()
    id_compra: number

    @Column()
    nombre: string

    @Column()
    dni: number

    @Column()
    fecha_nacimiento: Date

    @Column()
    genero: string

    @Column()
    telefono: Number

    @Column()
    correo: string

    @Column()
    nombre_contacto: string

    @Column()
    telefono_contacto: Number

    @Column({ type: 'number', nullable: true })
    id_silla: Number | null

    @Column()
    cambios_silla: Number = 0

    @Column()
    checkin_realizado: boolean

    @ManyToOne(() => CompraReserva, (compra) => compra.pasajeros, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_compra' })
    compraReserva: CompraReserva;
}
