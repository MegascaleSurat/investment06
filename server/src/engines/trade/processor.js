const { logger } = require('../../core/logger');

async function processTradeJob(job) {
  logger.info({ jobId: job.id, name: job.name, data: job.data }, 'Processing trade engine job');
  return { ok: true };
}

module.exports = { processTradeJob };

