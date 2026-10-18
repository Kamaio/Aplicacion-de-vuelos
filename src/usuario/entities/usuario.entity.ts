import { Column, Entity, OneToOne } from "typeorm";
import { InformacionPerfil } from "./informacionPerfil.entity";

@Entity()
export class Usuario {

    @Column({primary: true, generated: true})
    id_usuario: number;

    @Column()
    usuario: string;

    @Column()
    contrasena: string;

    @Column()
    correo: string;

    @Column()
    rol: string;

    @Column({default: true})
    activo: boolean = true;

    @OneToOne(() => InformacionPerfil, informacionPerfil => informacionPerfil.usuario)
    informacionPerfil: InformacionPerfil;
}