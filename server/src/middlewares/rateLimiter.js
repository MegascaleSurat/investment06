const rateLimit = require('express-rate-limit');

const { env } = require('../config');

const apiRateLimiter = env.NODE_ENV === 'development'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    });

module.exports = { apiRateLimiter };

