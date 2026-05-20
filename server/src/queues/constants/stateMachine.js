export const QUEUE_NAMES = {
  STATE_TRANSITION: 'stateTransitionWorker',
  STUCK_ORDER_DETECTOR: 'stuckOrderDetectorWorker',
  CRASH_RECOVERY: 'crashRecoveryWorker',
};

export const JOB_NAMES = {
  PROCESS_TRANSITION: 'processTransitionJob',
  DETECT_STUCK_ORDERS: 'detectStuckOrdersJob',
  RUN_CRASH_RECOVERY: 'runCrashRecoveryJob',
};

export const CRON_SCHEDULES = {
  // Every 5 minutes
  STUCK_ORDER_DETECTOR_MS: 300000,
};
