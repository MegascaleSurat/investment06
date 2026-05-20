import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/alertNotification.js';
import logger from '../../config/logger.js';

// Initialize Queues
const alertDispatchQueue = createQueue(QUEUE_NAMES.ALERT_DISPATCH);
const engineHeartbeatQueue = createQueue(QUEUE_NAMES.ENGINE_HEARTBEAT);
const kiteConnectionMonitorQueue = createQueue(QUEUE_NAMES.KITE_CONNECTION_MONITOR);
const tradeLogWriterQueue = createQueue(QUEUE_NAMES.TRADE_LOG_WRITER);

/**
 * Schedules all recurring Alert & Notification cron jobs.
 * Call this during application startup.
 */
export const scheduleAlertNotificationCronJobs = async () => {
  if (!engineHeartbeatQueue) {
    logger.warn('⚠️ Redis disabled. Alert & Notification cron jobs not scheduled.');
    return;
  }

  try {
    // 1. Engine Heartbeat Check (Every 60 sec)
    await engineHeartbeatQueue.add(
      JOB_NAMES.CHECK_HEARTBEATS,
      { triggeredBy: 'cron' },
      { repeat: { pattern: CRON_SCHEDULES.ENGINE_HEARTBEAT }, jobId: 'cron-engine-heartbeats' }
    );

    logger.info('🕒 Alert & Notification cron jobs successfully scheduled');
  } catch (error) {
    logger.error('❌ Failed to schedule Alert & Notification cron jobs:', error);
  }
};

/**
 * Queue an alert for processing and dispatching
 */
export const queueAlertDispatchJob = async (alertData) => {
  if (!alertDispatchQueue) return;
  try {
    const jobId = `alert-${alertData.userId}-${alertData.alertName}-${Date.now()}`;
    await alertDispatchQueue.add(
      JOB_NAMES.DISPATCH_ALERT,
      alertData,
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    );
    logger.debug({ jobId }, 'Queued alert dispatch job');
  } catch (err) {
    logger.error('Failed to queue alert dispatch job:', err);
  }
};

/**
 * Queue a Kite WS reconnection task
 */
export const queueReconnectKiteJob = async (userId, attempt = 1, delayMs = 1000) => {
  if (!kiteConnectionMonitorQueue) return;
  try {
    const jobId = `reconnect-${userId}-${attempt}-${Date.now()}`;
    await kiteConnectionMonitorQueue.add(
      JOB_NAMES.RECONNECT_KITE,
      { userId, attempt },
      {
        jobId,
        delay: delayMs, // Delay execution for backoff purposes
        attempts: 1, // Let our service handle subsequent attempts manually to adjust backoff delay dynamically
      }
    );
    logger.info({ userId, attempt, delayMs }, 'Queued Kite reconnection retry job');
  } catch (err) {
    logger.error('Failed to queue Kite reconnection retry job:', err);
  }
};

/**
 * Queue a trade log write task
 */
export const queueTradeLogJob = async (logData) => {
  if (!tradeLogWriterQueue) {
    // Fallback: write directly to console/logger if queue disabled
    logger.debug({ tradeId: logData.tradeId, message: logData.message }, 'Queue disabled, direct log');
    return;
  }
  try {
    const jobId = `tradelog-${logData.tradeId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    await tradeLogWriterQueue.add(
      JOB_NAMES.WRITE_TRADE_LOG,
      logData,
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    );
  } catch (err) {
    logger.error('Failed to queue trade log job:', err);
  }
};
