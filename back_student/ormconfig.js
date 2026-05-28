const isProduction = process.env.NODE_ENV === 'production';

const readRequiredEnv = (name) => {
   const value = process.env[name];
   if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
   }

   return value;
};

// Support DATABASE_URL for Render deployment
let config;
if (process.env.DATABASE_URL) {
   // Parse DATABASE_URL format: mysql://user:password@host:port/database
   const url = new URL(process.env.DATABASE_URL);
   config = {
      type: 'mysql',
      host: url.hostname,
      port: Number(url.port || '3306'),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
   };
} else {
   config = {
      type: 'mysql',
      host: readRequiredEnv('DB_HOST'),
      port: Number(process.env.DB_PORT || '3306'),
      username: readRequiredEnv('DB_USER'),
      password: readRequiredEnv('DB_PASSWORD'),
      database: readRequiredEnv('DB_NAME'),
   };
}

module.exports = {
   ...config,
   synchronize: true,
   logging: false,
   migrationsRun: true,
   entities: [
      isProduction ? 'build/entity/**/*.js' : 'src/entity/**/*.ts'
   ],
   migrations: [
      isProduction ? 'build/migration/**/*.js' : 'src/migration/**/*.ts'
   ],
   subscribers: [
      isProduction ? 'build/subscriber/**/*.js' : 'src/subscriber/**/*.ts'
   ],
   cli: {
      entitiesDir: 'src/entity',
      migrationsDir: 'src/migration',
      subscribersDir: 'src/subscriber'
   }
};
