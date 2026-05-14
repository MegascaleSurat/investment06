import cron from 'node-cron';
import logger from '../config/logger.js';

export const initMarketScheduler = () => {
  // Market Open: Monday-Friday 09:15 AM
  cron.schedule('15 9 * * 1-5', () => {
    logger.info('🔔 Market Opening - Initializing trading engines');
    // Logic to start strategy engines
  });

  // Market Close: Monday-Friday 03:30 PM
  cron.schedule('30 15 * * 1-5', () => {
    logger.info('🔕 Market Closing - Reconciling positions');
    // Logic to stop engines and cleanup
  });

  logger.info('📅 Market scheduler initialized');
};
