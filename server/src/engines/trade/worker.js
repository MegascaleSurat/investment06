const { Worker } = require('bullmq');

const { logger } = require('../../core/logger');
const { connection } = require('../../queues/connection');
const { TRADE_ENGINE_QUEUE } = require('../../queues/tradeEngine.queue');

const { processTradeJob } = require('./processor');

function createTradeWorker() {
  const worker = new Worker(TRADE_ENGINE_QUEUE, processTradeJob, {
    connection,
    concurrency: 100
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Trade engine job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Trade engine job failed');
  });

  return worker;
}

module.exports = { createTradeWorker };
