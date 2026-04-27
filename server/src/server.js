const http = require('node:http');

const { createApp } = require('./app');
const { env } = require('./config');
const { logger } = require('./core/logger');
const { closeDb } = require('./db');
const { connection } = require('./queues/connection');

async function start() {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API server listening');
  });

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down API server...');
    await new Promise((resolve) => server.close(resolve));
    await Promise.allSettled([connection.quit(), closeDb()]);
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
}

start().catch((err) => {
  logger.error({ err }, 'Server bootstrap failed');
  process.exit(1);
});
