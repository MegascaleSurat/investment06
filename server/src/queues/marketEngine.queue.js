const { Queue } = require('bullmq');

const { connection } = require('./connection');
const { defaultJobOptions } = require('./defaults');

const MARKET_ENGINE_QUEUE = 'market-engine';

const marketEngineQueue = new Queue(MARKET_ENGINE_QUEUE, { connection, defaultJobOptions });

async function enqueueMarketEngine(name, data, opts) {
  return marketEngineQueue.add(name, data, opts);
}

module.exports = { MARKET_ENGINE_QUEUE, marketEngineQueue, enqueueMarketEngine };
