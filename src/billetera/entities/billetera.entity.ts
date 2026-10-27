import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tarjeta } from './tarjeta.entity';
import { Historial } from './historial.entity';

@Entity('billetera_financiera')
export class Billetera {
  @PrimaryGeneratedColumn()
  id_billetera: number;

  @Column()
  saldo: number;

  @Column()
  id_usuario: number;

  // Mantienes únicamente la relación de las tarjetas (1 a Muchos)
  @OneToMany(() => Tarjeta, (tarjeta) => tarjeta.billetera)
  tarjetas: Tarjeta[];

  // Mantienes únicamente la relación de las tarjetas (1 a Muchos)
  @OneToMany(() => Historial, (historial) => historial.billetera)
  historial: Historial[];
}