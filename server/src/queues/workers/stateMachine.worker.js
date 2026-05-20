import { createWorker } from '../../config/queue.js';
import { stateMachineProcessor } from '../processors/stateMachine.processor.js';
import { QUEUE_NAMES } from '../constants/stateMachine.js';
import logger from '../../config/logger.js';

// Active workers tracker
const workers = {};

/**
 * Initializes all 3 State Machine background workers
 */
export const initStateMachineWorkers = () => {
  try {
    // 1. stateTransitionWorker (concurrency 1 to preserve execution order of state transitions)
    workers.stateTransition = createWorker(QUEUE_NAMES.STATE_TRANSITION, stateMachineProcessor, {
      concurrency: 1,
    });

    // 2. stuckOrderDetectorWorker
    workers.stuckOrderDetector = createWorker(QUEUE_NAMES.STUCK_ORDER_DETECTOR, stateMachineProcessor, {
      concurrency: 1,
    });

    // 3. crashRecoveryWorker
    workers.crashRecovery = createWorker(QUEUE_NAMES.CRASH_RECOVERY, stateMachineProcessor, {
      concurrency: 1,
    });

    logger.info('🚀 All State Machine background workers initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize State Machine background workers:', error);
  }
};

/**
 * Clean up / close workers on shutdown
 */
export const shutdownStateMachineWorkers = async () => {
  logger.info('Shutting down State Machine workers...');
  for (const [name, worker] of Object.entries(workers)) {
    if (worker) {
      try {
        await worker.close();
        logger.info(`Closed state machine worker: ${name}`);
      } catch (err) {
        logger.error(`Error closing state machine worker ${name}:`, err);
      }
    }
  }
};

export default workers;
