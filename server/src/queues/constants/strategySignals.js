/**
 * Strategy and Signal Queues & Jobs Constants
 */
export const QUEUE_NAMES = {
  TRACKED_STOCK_ENGINE: 'trackedStockEngineQueue',
  CONFIRMATION_TIMER: 'confirmationTimerQueue',
  WEAK_MARKET_EXCEPTION: 'weakMarketExceptionQueue',
  VOLUME_SIGNAL_QUALITY: 'volumeSignalQualityQueue'
};

export const JOB_NAMES = {
  RUN_ENTRY_CHECKS: 'runEntryChecksJob',
  MONITOR_CONFIRMATION_TIMERS: 'monitorConfirmationTimersJob',
  RUN_WEAK_MARKET_EXCEPTION: 'runWeakMarketExceptionJob',
  EVALUATE_SIGNAL_QUALITY: 'evaluateSignalQualityJob'
};

export const CRON_SCHEDULES = {
  // Every 5 minutes: '*/5 * * * *'
  TRACKED_STOCK_ENGINE: '*/5 * * * *',
  
  // Every 30 seconds interval (in milliseconds)
  CONFIRMATION_TIMER_MS: 30000,
  
  // Every 5 minutes: '*/5 * * * *'
  WEAK_MARKET_EXCEPTION: '*/5 * * * *',
  
  // Every 15 minutes: '*/15 * * * *'
  VOLUME_SIGNAL_QUALITY: '*/15 * * * *'
};
