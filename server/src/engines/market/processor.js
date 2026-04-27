const { logger } = require('../../core/logger');

async function processMarketJob(job) {
  logger.info({ jobId: job.id, name: job.name, data: job.data }, 'Processing market engine job');

  // Place core logic here:
  // - fetch ticks (via market data feed)
  // - normalize to internal format
  // - publish to downstream engines
  return { ok: true };
}

module.exports = { processMarketJob };

