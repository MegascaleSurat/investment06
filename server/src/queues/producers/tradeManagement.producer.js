import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/tradeManagement.js';
import logger from '../../config/logger.js';

// Initialize Queues
const investedStockEngineQueue = createQueue(QUEUE_NAMES.INVESTED_STOCK_ENGINE);
const trailingSLEngineQueue = createQueue(QUEUE_NAMES.TRAILING_SL_ENGINE);
const exitRuleEngineQueue = createQueue(QUEUE_NAMES.EXIT_RULE_ENGINE);
const holdingDaysTrackerQueue = createQueue(QUEUE_NAMES.HOLDING_DAYS_TRACKER);
const cooldownTrackerQueue = createQueue(QUEUE_NAMES.COOLDOWN_TRACKER);
const partialFillHandlerQueue = createQueue(QUEUE_NAMES.PARTIAL_FILL_HANDLER);

/**
 * Schedules all the recurring trade management cron jobs.
 */
export const scheduleTradeManagementCronJobs = async () => {
  try {
    // 1. Invested Stock Engine: every 30 seconds
    if (investedStockEngineQueue) {
      await investedStockEngineQueue.add(
        JOB_NAMES.MONITOR_POSITIONS,
        { triggeredBy: 'cron' },
        { repeat: { every: CRON_SCHEDULES.MONITOR_POSITIONS_MS }, jobId: 'cron-monitor-positions' }
      );
      logger.info('🕒 Invested Stock Monitor cron scheduled (30s)');
    }

    // 2. Trailing SL Engine: every 30 seconds
    if (trailingSLEngineQueue) {
      await trailingSLEngineQueue.add(
        JOB_NAMES.EVALUATE_TRAILING_SL,
        { triggeredBy: 'cron' },
        { repeat: { every: CRON_SCHEDULES.EVALUATE_TRAILING_SL_MS }, jobId: 'cron-evaluate-trailing-sl' }
      );
      logger.info('🕒 Trailing SL Engine cron scheduled (30s)');
    }

    // 3. Exit Rule Engine: every 30 seconds
    if (exitRuleEngineQueue) {
      await exitRuleEngineQueue.add(
        JOB_NAMES.RUN_EXIT_RULES,
        { triggeredBy: 'cron' },
        { repeat: { every: CRON_SCHEDULES.RUN_EXIT_RULES_MS }, jobId: 'cron-run-exit-rules' }
      );
      logger.info('🕒 Exit Rule Engine cron scheduled (30s)');
    }

    // 4. Holding Days Tracker: Daily after 15:30
    if (holdingDaysTrackerQueue) {
      await holdingDaysTrackerQueue.add(
        JOB_NAMES.INCREMENT_HOLDING_DAYS,
        { triggeredBy: 'cron' },
        { repeat: { cron: CRON_SCHEDULES.HOLDING_DAYS_CRON }, jobId: 'cron-increment-holding-days' }
      );
      logger.info('🕒 Holding Days Tracker cron scheduled (Daily 15:35)');
    }

    // 5. Cooldown Tracker: Daily at market open (09:15)
    if (cooldownTrackerQueue) {
      await cooldownTrackerQueue.add(
        JOB_NAMES.PROCESS_COOLDOWNS,
        { triggeredBy: 'cron' },
        { repeat: { cron: CRON_SCHEDULES.COOLDOWN_TRACKER_CRON }, jobId: 'cron-process-cooldowns' }
      );
      logger.info('🕒 Cooldown Tracker cron scheduled (Daily 09:15)');
    }
  } catch (error) {
    logger.error('❌ Failed to schedule Trade Management cron jobs:', error);
  }
};

/**
 * Queue a Partial Fill Handler job when a PARTIAL fill event is received.
 */
export const queuePartialFillJob = async (data) => {
  if (!partialFillHandlerQueue) return;
  try {
    await partialFillHandlerQueue.add(JOB_NAMES.HANDLE_PARTIAL_FILL, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId }, 'Queued Partial Fill Handler Job successfully');
  } catch (err) {
    logger.error('Failed to queue Partial Fill Handler Job:', err);
  }
};
