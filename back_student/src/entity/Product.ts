import {IsBoolean, IsInt, IsNotEmpty, Length, Min} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['name'])
export class Product {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @IsNotEmpty()
  @Length(2, 100)
  public name: string;

  @Column()
  @IsNotEmpty()
  @Length(2, 100)
  public category: string;

  @Column('text')
  @Length(0, 255)
  public description: string;

  @Column('int')
  @IsInt()
  @Min(0)
  public amount: number;

  @Column('float')
  @Min(0)
  public price: number;

  @Column()
  @IsBoolean()
  public hasExpiryDate: boolean;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}

