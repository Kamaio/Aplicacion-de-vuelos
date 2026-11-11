import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";


@Entity('sillas')
export class Silla {
    @PrimaryGeneratedColumn()
    id_silla: number

    @Column()
    id_vuelo: number

    @Column()
    numero_silla: string

    @Column()
    clase: string

    @Column()
    estado: string
}
