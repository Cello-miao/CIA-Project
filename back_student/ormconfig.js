const isProduction = process.env.NODE_ENV === 'production';

const readRequiredEnv = (name) => {
   const value = process.env[name];
   if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
   }

   return value;
};

// Support DATABASE_URL for Render deployment (PostgreSQL or MySQL)
let config;
if (process.env.DATABASE_URL) {
   try {
      const url = new URL(process.env.DATABASE_URL);
      const protocol = url.protocol.replace(':', ''); // Get 'mysql' or 'postgresql'
      const database = url.pathname.slice(1) || 'cia_db'; // Remove leading /
      
      if (protocol === 'postgresql' || protocol === 'postgres') {
         // PostgreSQL configuration
         config = {
            type: 'postgres',
            host: url.hostname,
            port: Number(url.port || '5432'),
            username: url.username || 'postgres',
            password: url.password || '',
            database: database,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
         };
      } else if (protocol === 'mysql' || protocol === 'mysql2') {
         // MySQL configuration
         config = {
            type: 'mysql',
            host: url.hostname,
            port: Number(url.port || '3306'),
            username: url.username || 'root',
            password: url.password || '',
            database: database,
         };
      } else {
         throw new Error(`Unsupported database protocol: ${protocol}`);
      }
      
      console.log('Database config from DATABASE_URL:', {
         type: config.type,
         host: config.host,
         port: config.port,
         username: config.username,
         database: config.database,
      });
   } catch (error) {
      console.error('Failed to parse DATABASE_URL:', error.message);
      throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
   }
} else {
   // Fallback to individual environment variables
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
