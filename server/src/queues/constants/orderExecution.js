/**
 * Order Execution Queues & Jobs Constants
 */
export const QUEUE_NAMES = {
  PLACE_BUY_ORDER: 'placeBuyOrderQueue',
  PLACE_STOP_LOSS: 'placeStopLossQueue',
  MODIFY_STOP_LOSS: 'modifyStopLossQueue',
  PLACE_SELL_ORDER: 'placeSellOrderQueue',
  ORDER_STATUS_POLLER: 'orderStatusPollerQueue'
};

export const JOB_NAMES = {
  PLACE_BUY: 'placeBuyJob',
  PLACE_SL: 'placeSlJob',
  MODIFY_SL: 'modifySlJob',
  PLACE_SELL: 'placeSellJob',
  POLL_ORDER_STATUSES: 'pollOrderStatusesJob'
};

export const CRON_SCHEDULES = {
  // Every 30 seconds interval (in milliseconds)
  ORDER_STATUS_POLLER_MS: 30000
};
