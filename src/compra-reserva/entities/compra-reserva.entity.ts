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

    @Column()
    fecha_limite_pago: Date

    @Column()
    id_vuelo: number

    @IsOptional()
    @Column()
    fecha_pago: Date
}
