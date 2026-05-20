export const QUEUE_NAMES = {
  END_OF_DAY_ORCHESTRATOR: 'endOfDayMaintenanceWorker',
  STORE_DAILY_CANDLE: 'storeDailyCandleWorker',
  PRUNE_INTRADAY_DATA: 'pruneIntradayDataWorker',
  RECONCILE_POSITIONS: 'reconcilePositionsWorker',
  PERFORMANCE_SNAPSHOT: 'performanceSnapshotWorker',
};

export const JOB_NAMES = {
  RUN_EOD_ORCHESTRATION: 'run-eod-orchestration',
  STORE_DAILY_CANDLES: 'store-daily-candles',
  PRUNE_INTRADAY_DATA: 'prune-intraday-data',
  RECONCILE_POSITIONS: 'reconcile-positions',
  TAKE_PERFORMANCE_SNAPSHOT: 'take-performance-snapshot',
};

export const CRON_SCHEDULES = {
  // "Daily 15:35"
  EOD_ORCHESTRATION: '35 15 * * 1-5',
  // "Daily 15:35"
  STORE_DAILY_CANDLES: '35 15 * * 1-5',
  // "Weekly Sunday 00:00"
  PRUNE_INTRADAY_DATA: '0 0 * * 0',
  // "Daily 15:40"
  RECONCILE_POSITIONS: '40 15 * * 1-5',
  // "Daily 16:00"
  PERFORMANCE_SNAPSHOT: '0 16 * * 1-5',
};
