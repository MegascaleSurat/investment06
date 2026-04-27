const { logger } = require('../core/logger');
const { closeDb } = require('../db');
const { createMarketWorker } = require('../engines/market/worker');
const { createSectorWorker } = require('../engines/sector/worker');
const { createTradeWorker } = require('../engines/trade/worker');
const { connection } = require('../queues/connection');
const { startSchedulers } = require('../queues/schedulers');

async function startWorkers() {
  const { close: closeSchedulers } = startSchedulers();

  const marketWorker = createMarketWorker();
  const sectorWorker = createSectorWorker();
  const tradeWorker = createTradeWorker();

  logger.info('Workers started');

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down workers...');
    await Promise.allSettled([marketWorker.close(), sectorWorker.close(), tradeWorker.close()]);
    await Promise.allSettled([closeSchedulers()]);
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

startWorkers().catch((err) => {
  logger.error({ err }, 'Worker bootstrap failed');
  process.exit(1);
});
