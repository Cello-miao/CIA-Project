import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// 辅助函数：从文件或环境变量读取密钥
const getSecret = (fileEnv: string | undefined, regularEnv: string | undefined, defaultValue: string): string => {
  if (fileEnv && fs.existsSync(fileEnv)) {
    return fs.readFileSync(fileEnv, 'utf8').trim();
  }
  return regularEnv || defaultValue;
};

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: getSecret(
    process.env.DB_PASSWORD_FILE,
    process.env.DB_PASSWORD,
    ''
  ),
  database: process.env.DB_NAME || 'cia_db',
  synchronize: false, // 在生产环境中应设置为false
  logging: process.env.NODE_ENV === 'development',
  entities: [User],
  migrations: [__dirname + '/../migration/*{.ts,.js}'],
  subscribers: [],
});