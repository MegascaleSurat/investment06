import { createWorker } from '../../config/queue.js';
import { alertNotificationProcessor } from '../processors/alertNotification.processor.js';
import { QUEUE_NAMES } from '../constants/alertNotification.js';
import logger from '../../config/logger.js';

const workers = {};

/**
 * Initializes all Alert & Notification background workers
 */
export const initAlertNotificationWorkers = () => {
  try {
    workers.alertDispatch = createWorker(
      QUEUE_NAMES.ALERT_DISPATCH,
      alertNotificationProcessor,
      { concurrency: 2 } // Allow concurrent alerts processing
    );
    
    workers.engineHeartbeat = createWorker(
      QUEUE_NAMES.ENGINE_HEARTBEAT,
      alertNotificationProcessor,
      { concurrency: 1 }
    );

    workers.kiteConnectionMonitor = createWorker(
      QUEUE_NAMES.KITE_CONNECTION_MONITOR,
      alertNotificationProcessor,
      { concurrency: 1 }
    );

    workers.tradeLogWriter = createWorker(
      QUEUE_NAMES.TRADE_LOG_WRITER,
      alertNotificationProcessor,
      { concurrency: 5 } // High concurrency for bulk logging
    );

    logger.info('🚀 All Alert & Notification background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Alert & Notification background workers:', error);
  }
};

/**
 * Gracefully shuts down workers
 */
export const shutdownAlertNotificationWorkers = async () => {
  logger.info('Shutting down Alert & Notification background workers...');
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
