const { QueueScheduler } = require('bullmq');

const { connection } = require('./connection');
const { MARKET_ENGINE_QUEUE } = require('./marketEngine.queue');
const { SECTOR_ENGINE_QUEUE } = require('./sectorEngine.queue');
const { TRADE_ENGINE_QUEUE } = require('./tradeEngine.queue');

function startSchedulers() {
  const schedulers = [
    new QueueScheduler(MARKET_ENGINE_QUEUE, { connection }),
    new QueueScheduler(SECTOR_ENGINE_QUEUE, { connection }),
    new QueueScheduler(TRADE_ENGINE_QUEUE, { connection })
  ];

  return {
    schedulers,
    async close() {
      await Promise.allSettled(schedulers.map((s) => s.close()));
    }
  };
}

module.exports = { startSchedulers };

