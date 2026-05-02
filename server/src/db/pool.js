const { Pool } = require('pg');

const { env } = require('../config');
const { logger } = require('../core/logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  statement_timeout: env.NODE_ENV === 'production' ? 15_000 : 0,
  application_name: 'trading-backend'
});

pool.on("connect", () => {
  logger.info("PostgreSQL connected");
});

pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error');
});

module.exports = { pool };

