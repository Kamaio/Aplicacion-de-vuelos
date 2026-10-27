import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Billetera } from './billetera.entity';

@Entity('tarjeta')
export class Tarjeta {
  @PrimaryGeneratedColumn()
  id_tarjeta: number;

  @Column()
  numero_tarjeta: string;

  @Column()
  tipo_tarjeta: string;

  @Column()
  franquicia: string;

  @Column({ type: 'date' })
  fecha_expiracion: Date;

  @Column()
  id_billetera: number;

  @ManyToOne(() => Billetera, (billetera) => billetera.tarjetas)
  @JoinColumn({ name: 'id_billetera' })
  billetera: Billetera;
}