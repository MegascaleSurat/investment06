import cron from 'node-cron';
import { 
  strategyEngineQueue, 
  exitEngineQueue, 
  historicalFetchQueue 
} from '../queues/index.js';
import logger from '../utils/logger.js';

const IST_TIMEZONE = 'Asia/Kolkata';

export const startSchedulers = () => {
  logger.info('🚀 Initializing cron schedulers...');

  // 15 9 * * 1-5 → Market Open Strategy Scan
  cron.schedule('15 9 * * 1-5', () => {
    logger.info('⏰ Cron: Triggering MARKET_OPEN strategy scan');
    strategyEngineQueue.add('market-open', { trigger: 'MARKET_OPEN' });
  }, { timezone: IST_TIMEZONE });

  // */5 9-15 * * 1-5 → Periodic Strategy Evaluation
  cron.schedule('*/5 9-15 * * 1-5', () => {
    logger.info('⏰ Cron: Triggering PERIODIC strategy evaluation');
    strategyEngineQueue.add('periodic-scan', { trigger: 'PERIODIC' });
  }, { timezone: IST_TIMEZONE });

  // */1 9-15 * * 1-5 → Exit Engine (Every minute, but we'll use setInterval for 30s)
  cron.schedule('*/1 9-15 * * 1-5', () => {
    logger.debug('⏰ Cron: Enqueuing Exit Engine job');
    exitEngineQueue.add('exit-check', { trigger: 'INTERVAL' });
    
    // Quick workaround for 30s within the minute cron
    setTimeout(() => {
      exitEngineQueue.add('exit-check-30s', { trigger: 'INTERVAL' });
    }, 30000);
  }, { timezone: IST_TIMEZONE });

  // */15 9-15 * * 1-5 → Volume Intelligence
  cron.schedule('*/15 9-15 * * 1-5', () => {
    logger.info('⏰ Cron: Triggering VOLUME_CANDLE fetch');
    historicalFetchQueue.add('volume-candle', { trigger: 'VOLUME_CANDLE' });
  }, { timezone: IST_TIMEZONE });

  // 30 8 * * 1-5 → Pre-market Baseline
  cron.schedule('30 8 * * 1-5', () => {
    logger.info('⏰ Cron: Triggering PRE_MARKET_BASELINE');
    historicalFetchQueue.add('pre-market-baseline', { trigger: 'PRE_MARKET_BASELINE' });
  }, { timezone: IST_TIMEZONE });

  // 31 15 * * 1-5 → EOD Maintenance
  cron.schedule('31 15 * * 1-5', () => {
    logger.info('⏰ Cron: Triggering EOD_MAINTENANCE');
    strategyEngineQueue.add('eod-maintenance', { trigger: 'EOD_MAINTENANCE' });
  }, { timezone: IST_TIMEZONE });

  logger.info('✅ All cron jobs scheduled');
};

export default { startSchedulers };
