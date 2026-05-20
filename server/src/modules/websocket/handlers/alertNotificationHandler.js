import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS } from '../constants/events.js';
import { 
  queueAlertDispatchJob, 
  queueReconnectKiteJob, 
  queueTradeLogJob 
} from '../../../queues/producers/alertNotification.producer.js';
import logger from '../../../config/logger.js';

/**
 * Alert & Notification Event Handler
 * Connects internal event bus events to queue producers.
 */
export const registerAlertNotificationHandler = () => {
  // 1. New Alert Raised (Bridge to alert dispatch worker queue)
  eventBus.on(INTERNAL_EVENTS.ALERT_NEW_RAISED, (alertData) => {
    logger.debug({ alertName: alertData.alertName }, 'Received internal ALERT_NEW_RAISED. Queueing dispatch job...');
    queueAlertDispatchJob(alertData);
  });

  // 2. Ticker Disconnected (Bridge to connection monitor reconnect queue with exponential backoff)
  eventBus.on(INTERNAL_EVENTS.TICKER_DISCONNECTED, ({ userId }) => {
    logger.info({ userId }, 'Received internal TICKER_DISCONNECTED. Queueing Kite connection monitor job...');
    queueReconnectKiteJob(userId, 1, 1000); // Attempt 1, 1s initial delay
  });

  // 3. Trade Log Request (Bridge to trade log async writer queue)
  eventBus.on('trade:log:request', (logData) => {
    queueTradeLogJob(logData);
  });

  logger.info('Alert & Notification WebSocket/Internal event handlers registered');
};

export default registerAlertNotificationHandler;
