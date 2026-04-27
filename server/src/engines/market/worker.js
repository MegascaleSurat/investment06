const { Worker } = require('bullmq');

const { logger } = require('../../core/logger');
const { connection } = require('../../queues/connection');
const { MARKET_ENGINE_QUEUE } = require('../../queues/marketEngine.queue');

const { processMarketJob } = require('./processor');

function createMarketWorker() {
  const worker = new Worker(MARKET_ENGINE_QUEUE, processMarketJob, {
    connection,
    concurrency: 50
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Market engine job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Market engine job failed');
  });

  return worker;
}

module.exports = { createMarketWorker };
