export const QUEUE_NAMES = {
  INVESTED_STOCK_ENGINE: 'investedStockEngineWorker',
  TRAILING_SL_ENGINE: 'trailingSLEngineWorker',
  EXIT_RULE_ENGINE: 'exitRuleEngineWorker',
  HOLDING_DAYS_TRACKER: 'holdingDaysTrackerWorker',
  COOLDOWN_TRACKER: 'cooldownTrackerWorker',
  PARTIAL_FILL_HANDLER: 'partialFillHandlerWorker',
};

export const JOB_NAMES = {
  MONITOR_POSITIONS: 'monitorPositionsJob',
  EVALUATE_TRAILING_SL: 'evaluateTrailingSlJob',
  RUN_EXIT_RULES: 'runExitRulesJob',
  INCREMENT_HOLDING_DAYS: 'incrementHoldingDaysJob',
  PROCESS_COOLDOWNS: 'processCooldownsJob',
  HANDLE_PARTIAL_FILL: 'handlePartialFillJob',
};

export const CRON_SCHEDULES = {
  // Every 30 seconds
  MONITOR_POSITIONS_MS: 30000,
  EVALUATE_TRAILING_SL_MS: 30000,
  RUN_EXIT_RULES_MS: 30000,

  // Daily after 15:30 (e.g. 15:35 Monday to Friday)
  HOLDING_DAYS_CRON: '35 15 * * 1-5',

  // Daily at market open (e.g. 09:15 Monday to Friday)
  COOLDOWN_TRACKER_CRON: '15 9 * * 1-5',
};
