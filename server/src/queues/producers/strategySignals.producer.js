import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/strategySignals.js';
import logger from '../../config/logger.js';

// Initialize Queues
const trackedStockEngineQueue = createQueue(QUEUE_NAMES.TRACKED_STOCK_ENGINE);
const confirmationTimerQueue = createQueue(QUEUE_NAMES.CONFIRMATION_TIMER);
const weakMarketExceptionQueue = createQueue(QUEUE_NAMES.WEAK_MARKET_EXCEPTION);
const volumeSignalQualityQueue = createQueue(QUEUE_NAMES.VOLUME_SIGNAL_QUALITY);

/**
 * Schedules all recurring Strategy & Signal cron jobs.
 * Call this during application startup.
 */
export const scheduleStrategySignalsCronJobs = async () => {
  if (!trackedStockEngineQueue) {
    logger.warn('⚠️ Redis disabled. Strategy and Signal cron jobs not scheduled.');
    return;
  }

  try {
    // 1. Tracked Stock Entry checks (Every 5 mins)
    await trackedStockEngineQueue.add(
      JOB_NAMES.RUN_ENTRY_CHECKS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.TRACKED_STOCK_ENGINE }, jobId: 'cron-run-entry-checks' }
    );

    // 2. Confirmation Timer Monitors (Every 30 seconds)
    await confirmationTimerQueue.add(
      JOB_NAMES.MONITOR_CONFIRMATION_TIMERS,
      { triggeredBy: 'cron' },
      { repeat: { every: CRON_SCHEDULES.CONFIRMATION_TIMER_MS }, jobId: 'cron-monitor-confirmation-timers' }
    );

    // 3. Weak Market Exception Checks (Every 5 mins)
    await weakMarketExceptionQueue.add(
      JOB_NAMES.RUN_WEAK_MARKET_EXCEPTION,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.WEAK_MARKET_EXCEPTION }, jobId: 'cron-weak-market-exception' }
    );

    // 4. Signal Quality Scoring (Every 15 mins)
    await volumeSignalQualityQueue.add(
      JOB_NAMES.EVALUATE_SIGNAL_QUALITY,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.VOLUME_SIGNAL_QUALITY }, jobId: 'cron-eval-signal-quality' }
    );

    logger.info('🕒 Strategy and Signal cron jobs successfully scheduled');
  } catch (error) {
    logger.error('❌ Failed to schedule Strategy and Signal cron jobs:', error);
  }
};

/**
 * Trigger immediate execution of tracked stock entry checks.
 */
export const triggerTrackedStockEngine = async () => {
  if (!trackedStockEngineQueue) return;
  try {
    await trackedStockEngineQueue.add(
      JOB_NAMES.RUN_ENTRY_CHECKS,
      { triggeredBy: 'manual', timestamp: new Date() },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );
  } catch (err) {
    logger.error('Failed to trigger manual entry checks:', err);
  }
};
