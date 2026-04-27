const IORedis = require('ioredis');

const { env } = require('../config');
const { logger } = require('../core/logger');

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

connection.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

module.exports = { connection };

