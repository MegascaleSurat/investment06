const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');

const { env } = require('./config');
const { errorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');
// const { apiRateLimiter } = require('./middlewares/rateLimiter');
const { httpLogger } = require('./middlewares/requestLogger');
const { apiRouter } = require('./modules');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(httpLogger);
  app.use(helmet());
  app.use(hpp());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true
    })
  );
  // app.use(apiRateLimiter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'trading-backend',
      time: new Date().toISOString()
    });
  });

  app.use('/api/v1', apiRouter);
  app.use('/api/v2', require('./v2').apiRouter);
  app.use('/api', apiRouter); // Fallback for existing clients

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
