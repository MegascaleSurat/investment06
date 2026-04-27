const { logger } = require('../../core/logger');

async function processSectorJob(job) {
  logger.info({ jobId: job.id, name: job.name, data: job.data }, 'Processing sector engine job');
  return { ok: true };
}

module.exports = { processSectorJob };

