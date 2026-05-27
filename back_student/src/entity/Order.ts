import {IsInt, IsNotEmpty, Length, Min} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {Product} from './Product';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @IsNotEmpty()
  @Length(2, 100)
  public name: string;

  @Column('int')
  @IsInt()
  @Min(1)
  public amount: number;

  @Column('float')
  @Min(0)
  public totalPrice: number;

  @ManyToOne(() => Product, {eager: true, onDelete: 'RESTRICT'})
  @JoinColumn()
  public product: Product;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}

