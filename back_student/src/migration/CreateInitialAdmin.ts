import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class CreateInitialAdmin implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    if (!process.env.INITIAL_ADMIN_PASSWORD) {
      console.warn('⚠️ [SECURITY] INITIAL_ADMIN_PASSWORD env not found.');
      console.warn(`⚠️ [SECURITY] Temporarily generated admin password: ${adminPassword}`);
      console.warn('⚠️ [SECURITY] Please log in and CHANGE THIS PASSWORD IMMEDIATELY!');
    }

    await queryRunner.query(
      `INSERT INTO user (username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
      ['admin', hashedPassword, 'ADMIN']
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DELETE FROM user WHERE username = ? AND role = ?`, ['admin', 'ADMIN']);
  }
}
