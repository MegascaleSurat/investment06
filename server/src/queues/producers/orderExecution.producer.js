import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/orderExecution.js';
import logger from '../../config/logger.js';

// Initialize Queues
const placeBuyOrderQueue = createQueue(QUEUE_NAMES.PLACE_BUY_ORDER);
const placeStopLossQueue = createQueue(QUEUE_NAMES.PLACE_STOP_LOSS);
const modifyStopLossQueue = createQueue(QUEUE_NAMES.MODIFY_STOP_LOSS);
const placeSellOrderQueue = createQueue(QUEUE_NAMES.PLACE_SELL_ORDER);
const orderStatusPollerQueue = createQueue(QUEUE_NAMES.ORDER_STATUS_POLLER);

/**
 * Schedules the recurring order status polling cron job.
 */
export const scheduleOrderExecutionCronJobs = async () => {
  if (!orderStatusPollerQueue) {
    logger.warn('⚠️ Redis disabled. Order Status Poller cron job not scheduled.');
    return;
  }

  try {
    await orderStatusPollerQueue.add(
      JOB_NAMES.POLL_ORDER_STATUSES,
      { triggeredBy: 'cron' },
      { repeat: { every: CRON_SCHEDULES.ORDER_STATUS_POLLER_MS }, jobId: 'cron-order-status-poller' }
    );
    logger.info('🕒 Order status poller cron job successfully scheduled (30s)');
  } catch (error) {
    logger.error('❌ Failed to schedule Order Status Poller cron job:', error);
  }
};

/**
 * Queue a Buy Order job on BUY signal event.
 */
export const queueBuyOrderJob = async (data) => {
  if (!placeBuyOrderQueue) return;
  try {
    await placeBuyOrderQueue.add(JOB_NAMES.PLACE_BUY, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ userId: data.userId, stockId: data.stockId }, 'Queued Buy Order Job successfully');
  } catch (err) {
    logger.error('Failed to queue Buy Order Job:', err);
  }
};

/**
 * Queue a Stop Loss placement job.
 */
export const queueStopLossJob = async (data) => {
  if (!placeStopLossQueue) return;
  try {
    await placeStopLossQueue.add(JOB_NAMES.PLACE_SL, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId }, 'Queued Stop Loss placement Job successfully');
  } catch (err) {
    logger.error('Failed to queue Stop Loss placement Job:', err);
  }
};

/**
 * Queue a Modify Stop Loss job when price trails.
 */
export const queueModifyStopLossJob = async (data) => {
  if (!modifyStopLossQueue) return;
  try {
    await modifyStopLossQueue.add(JOB_NAMES.MODIFY_SL, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId }, 'Queued Modify Stop Loss Job successfully');
  } catch (err) {
    logger.error('Failed to queue Modify Stop Loss Job:', err);
  }
};

/**
 * Queue a Sell Order job on exit trigger.
 */
export const queueSellOrderJob = async (data) => {
  if (!placeSellOrderQueue) return;
  try {
    await placeSellOrderQueue.add(JOB_NAMES.PLACE_SELL, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId }, 'Queued Sell Order Job successfully');
  } catch (err) {
    logger.error('Failed to queue Sell Order Job:', err);
  }
};

/**
 * Queue a manual/on-demand Order Status Poller job.
 */
export const queueOrderStatusPollerJob = async (data) => {
  if (!orderStatusPollerQueue) return;
  try {
    await orderStatusPollerQueue.add(JOB_NAMES.POLL_ORDER_STATUSES, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    logger.info({ tradeId: data.tradeId }, 'Queued Order Status Poller Job successfully');
  } catch (err) {
    logger.error('Failed to queue Order Status Poller Job:', err);
  }
};
