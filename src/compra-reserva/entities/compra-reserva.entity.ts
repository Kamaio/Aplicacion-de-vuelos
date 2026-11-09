import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Pasajero } from "./pasajero.entity";

@Entity('compra_reserva')
export class CompraReserva {
    @PrimaryGeneratedColumn()
    id_compra: number

    @Column()
    codigo_reserva: string

    @Column()
    id_usuario: number

    @Column()
    monto_total: number

    @Column()
    estado: string

    @Column()
    metodo_pago: string

    @Column()
    fecha_reserva: Date

    @Column({ type: 'timestamp', nullable: true })
    fecha_limite_pago: Date | null

    @Column()
    id_vuelo: number

    @Column({ type: 'timestamp', nullable: true })
    fecha_pago: Date | null

    @OneToMany(() => Pasajero, (pasajero) => pasajero.compraReserva, { cascade: true })
    pasajeros: Pasajero[];
}
