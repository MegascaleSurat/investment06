const pino = require('pino');

const { env } = require('../config');

const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie'
    ],
    remove: true
  },
  base: {
    service: 'trading-backend'
  }
});

module.exports = { logger };

