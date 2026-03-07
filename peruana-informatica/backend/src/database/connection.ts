import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'peruana_informatica',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (sql: string) => logger.debug(sql) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// Force utf8mb4 charset on every new connection (mysql2 v2 callback API)
sequelize.addHook('afterConnect', (connection: any) => {
  return new Promise<void>((resolve, reject) => {
    connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci', (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Base de datos conectada correctamente');
  } catch (error) {
    logger.error('Error conectando a la BD', { error });
    process.exit(1);
  }
}