import {compareSync, hashSync} from 'bcryptjs';
import {Exclude} from 'class-transformer';
import {IsNotEmpty, Length, Matches} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import config from '../config/config';

@Entity()
@Unique(['username'])
export class User {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  @Length(4, 20)
  public username: string;

  @Column()
  @Exclude()
  @Length(8, 100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    { message: 'Password must contain uppercase, lowercase, number and special character (@$!%*?&)' }
  )
  public password: string;

  @Column()
  @IsNotEmpty()
  public role: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  public hashPassword() {
    this.password = hashSync(this.password, config.bcryptSaltRounds);
  }

  public checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return compareSync(unencryptedPassword, this.password);
  }
}
