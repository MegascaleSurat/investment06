import { createWorker } from '../../config/queue.js';
import { orderExecutionProcessor } from '../processors/orderExecution.processor.js';
import { QUEUE_NAMES } from '../constants/orderExecution.js';
import logger from '../../config/logger.js';

// Active workers tracker
const workers = {};

/**
 * Initializes all 5 Order Execution background workers
 */
export const initOrderExecutionWorkers = () => {
  try {
    workers.placeBuyOrder = createWorker(QUEUE_NAMES.PLACE_BUY_ORDER, orderExecutionProcessor, {
      concurrency: 5, // Process multiple buy order requests concurrently
    });

    workers.placeStopLoss = createWorker(QUEUE_NAMES.PLACE_STOP_LOSS, orderExecutionProcessor, {
      concurrency: 5,
      // Retry strategy with exponential backoff for critical SL placement
      settings: {
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    workers.modifyStopLoss = createWorker(QUEUE_NAMES.MODIFY_STOP_LOSS, orderExecutionProcessor, {
      concurrency: 5,
    });

    workers.placeSellOrder = createWorker(QUEUE_NAMES.PLACE_SELL_ORDER, orderExecutionProcessor, {
      concurrency: 5,
    });

    workers.orderStatusPoller = createWorker(QUEUE_NAMES.ORDER_STATUS_POLLER, orderExecutionProcessor, {
      concurrency: 1,
    });

    logger.info('🚀 All Order Execution background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Order Execution background workers:', error);
  }
};

/**
 * Clean up / close workers on shutdown
 */
export const shutdownOrderExecutionWorkers = async () => {
  logger.info('Shutting down Order Execution workers...');
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
