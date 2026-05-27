const isProduction = process.env.NODE_ENV === 'production';

const readRequiredEnv = (name) => {
   const value = process.env[name];
   if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
   }

   return value;
};

module.exports = {
   type: 'mysql',
   host: readRequiredEnv('DB_HOST'),
   port: Number(process.env.DB_PORT || '3306'),
   username: readRequiredEnv('DB_USER'),
   password: readRequiredEnv('DB_PASSWORD'),
   database: readRequiredEnv('DB_NAME'),
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
