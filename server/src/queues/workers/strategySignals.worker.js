import { createWorker } from '../../config/queue.js';
import { strategySignalsProcessor } from '../processors/strategySignals.processor.js';
import { QUEUE_NAMES } from '../constants/strategySignals.js';
import logger from '../../config/logger.js';

// Active workers tracker
const workers = {};

/**
 * Initializes all 4 Strategy and Signal workers
 */
export const initStrategySignalsWorkers = () => {
  try {
    workers.trackedStockEngine = createWorker(QUEUE_NAMES.TRACKED_STOCK_ENGINE, strategySignalsProcessor, {
      concurrency: 1,
    });
    
    workers.confirmationTimer = createWorker(QUEUE_NAMES.CONFIRMATION_TIMER, strategySignalsProcessor, {
      concurrency: 1,
    });

    workers.weakMarketException = createWorker(QUEUE_NAMES.WEAK_MARKET_EXCEPTION, strategySignalsProcessor, {
      concurrency: 1,
    });

    workers.volumeSignalQuality = createWorker(QUEUE_NAMES.VOLUME_SIGNAL_QUALITY, strategySignalsProcessor, {
      concurrency: 1,
    });

    logger.info('🚀 All Strategy and Signal background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Strategy and Signal background workers:', error);
  }
};

/**
 * Clean up / close workers on shutdown
 */
export const shutdownStrategySignalsWorkers = async () => {
  logger.info('Shutting down Strategy and Signal workers...');
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
