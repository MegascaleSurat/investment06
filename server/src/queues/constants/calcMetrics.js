/**
 * Calculation & Metrics Queue Names
 */
export const QUEUE_NAMES = {
  CALC_AVG_VOLUME: 'calcAvgVolumeWorker',
  CALC_VOLUME_RATIO: 'calcVolumeRatioWorker',
  CALC_SLOT_VOLUME_BASELINE: 'calcSlotVolumeBaselineWorker',
  CALC_SLOT_VOLUME_RATIO: 'calcSlotVolumeRatioWorker',
  CALC_STOCK_METRICS: 'calcStockMetricsWorker',
  CALC_SECTOR_METRICS: 'calcSectorMetricsWorker',
  CALC_MARKET_STATUS: 'calcMarketStatusWorker',
};

/**
 * Job Names within each queue
 */
export const JOB_NAMES = {
  CALC_AVG_VOLUME: 'calc-avg-volume',
  CALC_VOLUME_RATIO: 'calc-volume-ratio',
  CALC_SLOT_VOLUME_BASELINE: 'calc-slot-volume-baseline',
  CALC_SLOT_VOLUME_RATIO: 'calc-slot-volume-ratio',
  CALC_STOCK_METRICS: 'calc-stock-metrics',
  CALC_SECTOR_METRICS: 'calc-sector-metrics',
  CALC_MARKET_STATUS: 'calc-market-status',
};

/**
 * Cron schedules — in IST (UTC+5:30)
 * Note: Redis/BullMQ repeat patterns use standard cron syntax
 */
export const CRON_SCHEDULES = {
  CALC_VOLUME_RATIO: '*/5 9-15 * * 1-5',          // Every 5 mins, Mon-Fri (09:15-15:30)
  CALC_SLOT_VOLUME_BASELINE: '35 15 * * 1-5',      // Daily after market close (15:35 IST), Mon-Fri
  CALC_SLOT_VOLUME_RATIO: '*/15 9-15 * * 1-5',     // Every 15 mins, Mon-Fri (09:15-15:30)
  CALC_STOCK_METRICS: '*/5 9-15 * * 1-5',         // Every 5 mins, Mon-Fri (09:15-15:30)
  CALC_SECTOR_METRICS: '*/5 9-15 * * 1-5',        // Every 5 mins, Mon-Fri (09:15-15:30)
  CALC_MARKET_STATUS: '*/5 9-15 * * 1-5',         // Every 5 mins, Mon-Fri (09:15-15:30)
};
