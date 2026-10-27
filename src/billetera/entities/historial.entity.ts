import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Billetera } from './billetera.entity';

@Entity('historial_transacciones')
export class Historial {
  @PrimaryGeneratedColumn()
  id_historial: number;

  @Column()
  fecha_transaccion: Date

  @Column()
  info_historial: string

  @Column()
  id_billetera: number;

  @ManyToOne(() => Billetera, (billetera) => billetera.historial)
  @JoinColumn({ name: 'id_billetera' })
  billetera: Billetera;
}