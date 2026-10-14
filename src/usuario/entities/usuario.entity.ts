import { Column, Entity } from "typeorm";

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

    @Column()
    activo: boolean;
}
