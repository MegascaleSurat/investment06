const { randomUUID } = require('node:crypto');

const pinoHttp = require('pino-http');

const { logger } = require('../core/logger');

const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = typeof existing === 'string' && existing.trim() ? existing : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});

module.exports = { httpLogger };
