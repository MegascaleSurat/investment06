import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/maintenance.js';
import logger from '../../config/logger.js';

// Initialize Queues
const endOfDayOrchestratorQueue = createQueue(QUEUE_NAMES.END_OF_DAY_ORCHESTRATOR);
const storeDailyCandleQueue = createQueue(QUEUE_NAMES.STORE_DAILY_CANDLE);
const pruneIntradayDataQueue = createQueue(QUEUE_NAMES.PRUNE_INTRADAY_DATA);
const reconcilePositionsQueue = createQueue(QUEUE_NAMES.RECONCILE_POSITIONS);
const performanceSnapshotQueue = createQueue(QUEUE_NAMES.PERFORMANCE_SNAPSHOT);

/**
 * Schedules all recurring EOD and Maintenance cron jobs.
 * Call this during application startup.
 */
export const scheduleMaintenanceCronJobs = async () => {
  if (!endOfDayOrchestratorQueue) {
    logger.warn('⚠️ Redis disabled. EOD & Maintenance cron jobs not scheduled.');
    return;
  }

  try {
    // 1. EOD Orchestration (Daily at 15:35 Mon-Fri)
    await endOfDayOrchestratorQueue.add(
      JOB_NAMES.RUN_EOD_ORCHESTRATION,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.EOD_ORCHESTRATION }, jobId: 'cron-eod-orchestration' }
    );

    // 2. Store Daily Candles (Daily at 15:35 Mon-Fri)
    await storeDailyCandleQueue.add(
      JOB_NAMES.STORE_DAILY_CANDLES,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.STORE_DAILY_CANDLES }, jobId: 'cron-store-daily-candles' }
    );

    // 3. Prune Intraday Data (Weekly Sunday at 00:00)
    await pruneIntradayDataQueue.add(
      JOB_NAMES.PRUNE_INTRADAY_DATA,
      { triggeredBy: 'cron', olderThanDays: 60 },
      { repeat: { pattern: CRON_SCHEDULES.PRUNE_INTRADAY_DATA }, jobId: 'cron-prune-intraday-data' }
    );

    // 4. Reconcile Positions (Daily at 15:40 Mon-Fri)
    await reconcilePositionsQueue.add(
      JOB_NAMES.RECONCILE_POSITIONS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.RECONCILE_POSITIONS }, jobId: 'cron-reconcile-positions' }
    );

    // 5. Performance Snapshot (Daily at 16:00 Mon-Fri)
    await performanceSnapshotQueue.add(
      JOB_NAMES.TAKE_PERFORMANCE_SNAPSHOT,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.PERFORMANCE_SNAPSHOT }, jobId: 'cron-performance-snapshot' }
    );

    logger.info('🕒 EOD & Maintenance cron jobs successfully scheduled');
  } catch (error) {
    logger.error('❌ Failed to schedule EOD & Maintenance cron jobs:', error);
  }
};

/**
 * Manually trigger End-of-Day Orchestration
 */
export const triggerEndOfDayOrchestration = async (date = new Date()) => {
  if (!endOfDayOrchestratorQueue) return;
  try {
    const jobId = `eod-manual-${Date.now()}`;
    await endOfDayOrchestratorQueue.add(
      JOB_NAMES.RUN_EOD_ORCHESTRATION,
      { triggeredBy: 'manual', date: date.toISOString(), timestamp: new Date() },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );
    logger.info(`Queued manual EOD Orchestration: ${jobId}`);
  } catch (err) {
    logger.error('Failed to trigger manual EOD orchestration:', err);
  }
};

/**
 * Manually trigger position reconciliation
 */
export const triggerPositionReconciliation = async (userId = null) => {
  if (!reconcilePositionsQueue) return;
  try {
    const jobId = `reconcile-manual-${Date.now()}`;
    await reconcilePositionsQueue.add(
      JOB_NAMES.RECONCILE_POSITIONS,
      { triggeredBy: 'manual', userId, timestamp: new Date() },
      {
        jobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 }
      }
    );
    logger.info(`Queued manual position reconciliation: ${jobId}`);
  } catch (err) {
    logger.error('Failed to trigger manual position reconciliation:', err);
  }
};

/**
 * Manually trigger performance snapshot
 */
export const triggerPerformanceSnapshot = async (date = new Date()) => {
  if (!performanceSnapshotQueue) return;
  try {
    const jobId = `perf-snapshot-manual-${Date.now()}`;
    await performanceSnapshotQueue.add(
      JOB_NAMES.TAKE_PERFORMANCE_SNAPSHOT,
      { triggeredBy: 'manual', date: date.toISOString(), timestamp: new Date() },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );
    logger.info(`Queued manual performance snapshot: ${jobId}`);
  } catch (err) {
    logger.error('Failed to trigger manual performance snapshot:', err);
  }
};
