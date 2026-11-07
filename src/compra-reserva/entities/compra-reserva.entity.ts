import { IsOptional } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
