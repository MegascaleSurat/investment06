import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/stateMachine.js';
import logger from '../../config/logger.js';

// Initialize Queues
const stateTransitionQueue = createQueue(QUEUE_NAMES.STATE_TRANSITION);
const stuckOrderDetectorQueue = createQueue(QUEUE_NAMES.STUCK_ORDER_DETECTOR);
const crashRecoveryQueue = createQueue(QUEUE_NAMES.CRASH_RECOVERY);

/**
 * Schedules all the recurring State Machine cron jobs.
 */
export const scheduleStateMachineCronJobs = async () => {
  try {
    // Stuck Order Detector: every 5 minutes
    if (stuckOrderDetectorQueue) {
      await stuckOrderDetectorQueue.add(
        JOB_NAMES.DETECT_STUCK_ORDERS,
        { triggeredBy: 'cron' },
        { repeat: { every: CRON_SCHEDULES.STUCK_ORDER_DETECTOR_MS }, jobId: 'cron-detect-stuck-orders' }
      );
      logger.info('🕒 Stuck Order Detector cron scheduled (5m)');
    }
  } catch (error) {
    logger.error('❌ Failed to schedule State Machine cron jobs:', error);
  }
};

/**
 * Queue a State Transition job.
 */
export const queueStateTransitionJob = async (data) => {
  if (!stateTransitionQueue) return null;
  try {
    const job = await stateTransitionQueue.add(JOB_NAMES.PROCESS_TRANSITION, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId, toState: data.toState }, 'Queued State Transition Job successfully');
    return job;
  } catch (err) {
    logger.error('Failed to queue State Transition Job:', err);
    return null;
  }
};

/**
 * Queue a crash recovery sequence job.
 */
export const queueCrashRecoveryJob = async (data = { triggeredBy: 'boot' }) => {
  if (!crashRecoveryQueue) return null;
  try {
    const job = await crashRecoveryQueue.add(JOB_NAMES.RUN_CRASH_RECOVERY, data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 2000 }
    });
    logger.info('Queued Crash Recovery Job successfully');
    return job;
  } catch (err) {
    logger.error('Failed to queue Crash Recovery Job:', err);
    return null;
  }
};
