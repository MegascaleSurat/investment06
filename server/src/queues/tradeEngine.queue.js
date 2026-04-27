const { Queue } = require('bullmq');

const { connection } = require('./connection');
const { defaultJobOptions } = require('./defaults');

const TRADE_ENGINE_QUEUE = 'trade-engine';

const tradeEngineQueue = new Queue(TRADE_ENGINE_QUEUE, { connection, defaultJobOptions });

async function enqueueTradeEngine(name, data, opts) {
  return tradeEngineQueue.add(name, data, opts);
}

module.exports = { TRADE_ENGINE_QUEUE, tradeEngineQueue, enqueueTradeEngine };
