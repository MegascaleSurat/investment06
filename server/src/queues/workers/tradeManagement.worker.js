import { createWorker } from '../../config/queue.js';
import { tradeManagementProcessor } from '../processors/tradeManagement.processor.js';
import { QUEUE_NAMES } from '../constants/tradeManagement.js';
import logger from '../../config/logger.js';

// Active workers tracker
const workers = {};

/**
 * Initializes all 6 Trade Management background workers
 */
export const initTradeManagementWorkers = () => {
  try {
    workers.investedStockEngine = createWorker(QUEUE_NAMES.INVESTED_STOCK_ENGINE, tradeManagementProcessor, {
      concurrency: 1,
    });

    workers.trailingSLEngine = createWorker(QUEUE_NAMES.TRAILING_SL_ENGINE, tradeManagementProcessor, {
      concurrency: 2,
    });

    workers.exitRuleEngine = createWorker(QUEUE_NAMES.EXIT_RULE_ENGINE, tradeManagementProcessor, {
      concurrency: 2,
    });

    workers.holdingDaysTracker = createWorker(QUEUE_NAMES.HOLDING_DAYS_TRACKER, tradeManagementProcessor, {
      concurrency: 1,
    });

    workers.cooldownTracker = createWorker(QUEUE_NAMES.COOLDOWN_TRACKER, tradeManagementProcessor, {
      concurrency: 1,
    });

    workers.partialFillHandler = createWorker(QUEUE_NAMES.PARTIAL_FILL_HANDLER, tradeManagementProcessor, {
      concurrency: 5, // Handle partial fills in parallel
      settings: {
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    logger.info('🚀 All Trade Management background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Trade Management background workers:', error);
  }
};

/**
 * Clean up / close workers on shutdown
 */
export const shutdownTradeManagementWorkers = async () => {
  logger.info('Shutting down Trade Management workers...');
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
