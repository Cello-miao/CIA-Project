declare const process: any;

const readNumberEnv = (name: string, fallback: number): number => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  jwtSecret: process.env.JWT_SECRET || '',
  bcryptSaltRounds: readNumberEnv('BCRYPT_SALT_ROUNDS', 12),
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME || '',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || '',
  defaultAdminRole: process.env.DEFAULT_ADMIN_ROLE || 'ADMIN',
};

export default config;

