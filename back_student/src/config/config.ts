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

export default {
  jwtSecret: getSecret(
    process.env.JWT_SECRET_FILE,
    process.env.JWT_SECRET,
    '@QEGTUI'
  ),
};
