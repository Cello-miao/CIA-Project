import {getRepository, MigrationInterface, QueryRunner} from 'typeorm';
import {User} from '../entity/User';

export class CreateAdminUser1572547308077 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Kh3$bF6&nT1*pY9vXc2@Dm5';
    const role = process.env.DEFAULT_ADMIN_ROLE || 'ADMIN';

    const user = new User();
    user.username = username;
    user.password = password;
    user.hashPassword();
    user.role = role;
    const userRepository = getRepository(User);
    await userRepository.save(user);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
