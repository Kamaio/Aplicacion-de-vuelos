import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Usuario } from "./usuario.entity";
import { IsOptional } from "class-validator";

@Entity()
export class InformacionPerfil {

    @Column({primary: true, generated: true})
    id_perfil: number;

    @OneToOne(() => Usuario, usuario => usuario.informacionPerfil, {onDelete: 'CASCADE'}) //cascade por buena practica nomas porque tenemos eliminacion logica
    @JoinColumn({name: 'id_usuario'})
    usuario: Usuario;

    @Column()
    dni: number;

    @Column()
    nombres: string;

    @Column()
    apellidos: string;

    @Column()
    fecha_nacimiento: Date;

    @Column()
    lugar_nacimiento: string;

    @Column()
    direccion_facturacion: string;

    @Column()
    genero: string;

    @IsOptional()
    @Column()
    foto_url: string;
}