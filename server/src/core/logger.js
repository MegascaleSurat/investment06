const pino = require('pino');
const { env } = require('../config');

const isDev = env.NODE_ENV !== 'production';

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
  },
  transport: isDev
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
    : undefined
});

module.exports = { logger };






// const pino = require('pino');
// const pinoPretty = require('pino-pretty');

// const { env } = require('../config');

// const logger = pino({
//   level: env.LOG_LEVEL,
//   redact: {
//     paths: [
//       'req.headers.authorization',
//       'req.headers.cookie',
//       'headers.authorization',
//       'headers.cookie'
//     ],
//     remove: true
//   },
//   base: {
//     service: 'trading-backend'
//   }
// });

// module.exports = { logger };

