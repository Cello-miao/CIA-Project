import {getRepository, MigrationInterface, QueryRunner} from 'typeorm';
import {User} from '../entity/User';

export class CreateAdminUser1572547308077 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const username = process.env.DEFAULT_ADMIN_USERNAME;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;
    const role = process.env.DEFAULT_ADMIN_ROLE || 'ADMIN';

    if (!username || !password) {
      throw new Error('Missing default admin seed credentials');
    }

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
