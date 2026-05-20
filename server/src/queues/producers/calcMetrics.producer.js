import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/calcMetrics.js';
import logger from '../../config/logger.js';

// Initialize Queues
const calcAvgVolumeQueue = createQueue(QUEUE_NAMES.CALC_AVG_VOLUME);
const calcVolumeRatioQueue = createQueue(QUEUE_NAMES.CALC_VOLUME_RATIO);
const calcSlotVolumeBaselineQueue = createQueue(QUEUE_NAMES.CALC_SLOT_VOLUME_BASELINE);
const calcSlotVolumeRatioQueue = createQueue(QUEUE_NAMES.CALC_SLOT_VOLUME_RATIO);
const calcStockMetricsQueue = createQueue(QUEUE_NAMES.CALC_STOCK_METRICS);
const calcSectorMetricsQueue = createQueue(QUEUE_NAMES.CALC_SECTOR_METRICS);
const calcMarketStatusQueue = createQueue(QUEUE_NAMES.CALC_MARKET_STATUS);

/**
 * Schedules all recurring Calculation & Metrics cron jobs.
 * Call this during application startup.
 */
export const scheduleCalcMetricsCronJobs = async () => {
  if (!calcVolumeRatioQueue) {
    logger.warn('⚠️ Redis disabled. Calculation & Metrics cron jobs not scheduled.');
    return;
  }

  try {
    // 1. Volume Ratio (Every 5 mins during market hours)
    await calcVolumeRatioQueue.add(
      JOB_NAMES.CALC_VOLUME_RATIO,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_VOLUME_RATIO }, jobId: 'cron-calc-volume-ratio' }
    );

    // 2. Slot Volume Baseline (Daily at 15:35 IST)
    await calcSlotVolumeBaselineQueue.add(
      JOB_NAMES.CALC_SLOT_VOLUME_BASELINE,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_SLOT_VOLUME_BASELINE }, jobId: 'cron-calc-slot-baseline' }
    );

    // 3. Slot Volume Ratio (Every 15 mins during market hours)
    await calcSlotVolumeRatioQueue.add(
      JOB_NAMES.CALC_SLOT_VOLUME_RATIO,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_SLOT_VOLUME_RATIO }, jobId: 'cron-calc-slot-ratio' }
    );

    // 4. Stock Metrics (Every 5 mins during market hours)
    await calcStockMetricsQueue.add(
      JOB_NAMES.CALC_STOCK_METRICS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_STOCK_METRICS }, jobId: 'cron-calc-stock-metrics' }
    );

    // 5. Sector Metrics (Every 5 mins during market hours)
    await calcSectorMetricsQueue.add(
      JOB_NAMES.CALC_SECTOR_METRICS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_SECTOR_METRICS }, jobId: 'cron-calc-sector-metrics' }
    );

    // 6. Market Status (Every 5 mins during market hours)
    await calcMarketStatusQueue.add(
      JOB_NAMES.CALC_MARKET_STATUS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.CALC_MARKET_STATUS }, jobId: 'cron-calc-market-status' }
    );

    logger.info('🕒 Calculation & Metrics cron jobs successfully scheduled');
  } catch (error) {
    logger.error('❌ Failed to schedule Calculation & Metrics cron jobs:', error);
  }
};

/**
 * Triggers manual calculation of 10-day average volumes for stocks.
 * Typically invoked when a new watchlist is uploaded.
 */
export const triggerAvgVolumeCalculation = async (userId = null) => {
  if (!calcAvgVolumeQueue) return;

  try {
    const jobId = `avg-vol-${Date.now()}`;
    await calcAvgVolumeQueue.add(
      JOB_NAMES.CALC_AVG_VOLUME,
      { userId, triggeredBy: 'manual', timestamp: new Date() },
      { 
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );
    logger.info(`Queued manual average volume calculation with jobId: ${jobId}`);
  } catch (error) {
    logger.error('Failed to queue manual average volume calculation:', error);
  }
};
