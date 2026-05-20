import { createWorker } from '../../config/queue.js';
import { calcMetricsProcessor } from '../processors/calcMetrics.processor.js';
import { QUEUE_NAMES } from '../constants/calcMetrics.js';
import logger from '../../config/logger.js';

// Active workers tracker
const workers = {};

/**
 * Initializes all 7 Calculation and Metrics workers
 */
export const initCalcMetricsWorkers = () => {
  try {
    workers.calcAvgVolume = createWorker(QUEUE_NAMES.CALC_AVG_VOLUME, calcMetricsProcessor, {
      concurrency: 1,
    });
    
    workers.calcVolumeRatio = createWorker(QUEUE_NAMES.CALC_VOLUME_RATIO, calcMetricsProcessor, {
      concurrency: 1,
    });

    workers.calcSlotVolumeBaseline = createWorker(QUEUE_NAMES.CALC_SLOT_VOLUME_BASELINE, calcMetricsProcessor, {
      concurrency: 1,
    });

    workers.calcSlotVolumeRatio = createWorker(QUEUE_NAMES.CALC_SLOT_VOLUME_RATIO, calcMetricsProcessor, {
      concurrency: 1,
    });

    workers.calcStockMetrics = createWorker(QUEUE_NAMES.CALC_STOCK_METRICS, calcMetricsProcessor, {
      concurrency: 1,
    });

    workers.calcSectorMetrics = createWorker(QUEUE_NAMES.CALC_SECTOR_METRICS, calcMetricsProcessor, {
      concurrency: 1,
    });

    workers.calcMarketStatus = createWorker(QUEUE_NAMES.CALC_MARKET_STATUS, calcMetricsProcessor, {
      concurrency: 1,
    });

    logger.info('🚀 All Calculation & Metrics workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Calculation & Metrics workers:', error);
  }
};

/**
 * Clean up / close workers on shutdown
 */
export const shutdownCalcMetricsWorkers = async () => {
  logger.info('Shutting down Calculation & Metrics workers...');
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
