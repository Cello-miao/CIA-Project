import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class CreateInitialAdmin implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    // 隐患修正 1: 优先从环境变量读取管理员密码，如果没有配置，则生成一个很难被猜到的临时强密码
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // 手动进行哈希（避免依赖 Entity 里的类方法）
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // 隐患修正 2: 打印提示。如果使用的是自动生成的强密码，让部署人员在日志中能看到
    if (!process.env.INITIAL_ADMIN_PASSWORD) {
      console.warn('⚠️ [SECURITY] INITIAL_ADMIN_PASSWORD env not found.');
      console.warn(`⚠️ [SECURITY] Temporarily generated admin password: ${adminPassword}`);
      console.warn('⚠️ [SECURITY] Please log in and CHANGE THIS PASSWORD IMMEDIATELY!');
    }

    // 隐患修正 3: 使用原生 SQL 插入，不依赖外部 Entity 实体类
    // MySQL 语法使用 ? 占位符
    await queryRunner.query(
      `INSERT INTO user (username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
      ['admin', hashedPassword, 'ADMIN']
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // 仅在确认安全的情况下回滚，或使用原生 SQL 删除指定初始账号
    await queryRunner.query(`DELETE FROM user WHERE username = ? AND role = ?`, ['admin', 'ADMIN']);
  }
}
