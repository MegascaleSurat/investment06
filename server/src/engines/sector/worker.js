const { Worker } = require('bullmq');

const { logger } = require('../../core/logger');
const { connection } = require('../../queues/connection');
const { SECTOR_ENGINE_QUEUE } = require('../../queues/sectorEngine.queue');

const { processSectorJob } = require('./processor');

function createSectorWorker() {
  const worker = new Worker(SECTOR_ENGINE_QUEUE, processSectorJob, {
    connection,
    concurrency: 50
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Sector engine job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Sector engine job failed');
  });

  return worker;
}

module.exports = { createSectorWorker };
