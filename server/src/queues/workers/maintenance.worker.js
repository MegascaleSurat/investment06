import { createWorker } from '../../config/queue.js';
import { maintenanceProcessor } from '../processors/maintenance.processor.js';
import { QUEUE_NAMES } from '../constants/maintenance.js';
import logger from '../../config/logger.js';

const workers = {};

/**
 * Initializes all EOD and maintenance workers
 */
export const initMaintenanceWorkers = () => {
  try {
    workers.endOfDayMaintenance = createWorker(
      QUEUE_NAMES.END_OF_DAY_ORCHESTRATOR,
      maintenanceProcessor,
      { concurrency: 1 }
    );
    
    workers.storeDailyCandle = createWorker(
      QUEUE_NAMES.STORE_DAILY_CANDLE,
      maintenanceProcessor,
      { concurrency: 1 }
    );

    workers.pruneIntradayData = createWorker(
      QUEUE_NAMES.PRUNE_INTRADAY_DATA,
      maintenanceProcessor,
      { concurrency: 1 }
    );

    workers.reconcilePositions = createWorker(
      QUEUE_NAMES.RECONCILE_POSITIONS,
      maintenanceProcessor,
      { concurrency: 1 }
    );

    workers.performanceSnapshot = createWorker(
      QUEUE_NAMES.PERFORMANCE_SNAPSHOT,
      maintenanceProcessor,
      { concurrency: 1 }
    );

    logger.info('🚀 All EOD & Maintenance background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize EOD & Maintenance background workers:', error);
  }
};

/**
 * Gracefully shuts down workers
 */
export const shutdownMaintenanceWorkers = async () => {
  logger.info('Shutting down EOD & Maintenance background workers...');
  for (const [name, worker] of Object.entries(workers)) {
    if (worker) {
      try {
        await worker.close();
        logger.info(`Closed worker: ${name}`);
      } catch (err) {
        logger.error(`Error closing worker ${name}:`, err);
      }
    }
  }
};

export default workers;
