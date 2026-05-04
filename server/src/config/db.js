import pg from 'pg';
import { env } from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('query error', { text, error });
    throw error;
  }
};

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('✅ Database connected successfully');
    client.release();
  } catch (err) {
    logger.error('❌ Database connection failed', err);
    process.exit(1);
  }
};

export default {
  query,
  testConnection,
  pool,
};
