import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index.js';
import { env } from './env.js';
import logger from './logger.js';

const client = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'production' ? 20 : 5,
  onnotice: (notice) => logger.debug(notice),
});

export const db = drizzle(client, { schema });

export async function connectDB() {
  try {
    await client`SELECT 1`;
    logger.info('📦 Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export default db;
