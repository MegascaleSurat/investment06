export const QUEUE_NAMES = {
  ALERT_DISPATCH: 'alertDispatchWorker',
  ENGINE_HEARTBEAT: 'engineHeartbeatWorker',
  KITE_CONNECTION_MONITOR: 'kiteConnectionMonitorWorker',
  TRADE_LOG_WRITER: 'tradeLogWriterWorker',
};

export const JOB_NAMES = {
  DISPATCH_ALERT: 'dispatch-alert',
  CHECK_HEARTBEATS: 'check-heartbeats',
  RECONNECT_KITE: 'reconnect-kite',
  WRITE_TRADE_LOG: 'write-trade-log',
};

export const CRON_SCHEDULES = {
  // "Every 60 sec"
  ENGINE_HEARTBEAT: '* * * * *',
};
