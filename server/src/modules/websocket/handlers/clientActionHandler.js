import { WS_EVENTS } from '../constants/events.js';
import {
  subscribeStocksSchema,
  unsubscribeStocksSchema,
  alertsMarkSeenSchema
} from '../validators/clientEvents.validation.js';
import clientActionService from '../services/clientActionService.js';
import logger from '../../../config/logger.js';

/**
 * Socket.IO Inbound Action Handler
 * Registers listeners on the client socket for inbound events and manages acknowledgements.
 */
export const registerClientActionHandlers = (socket) => {
  const { user } = socket;

  // 1. subscribe:stocks
  socket.on(WS_EVENTS.SUBSCRIBE_STOCKS, async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    try {
      logger.info({ userId: user.id, socketId: socket.id, payload }, `[Socket Inbound] Received ${WS_EVENTS.SUBSCRIBE_STOCKS}`);

      // Validate payload structure
      const parsed = subscribeStocksSchema.safeParse(payload);
      if (!parsed.success) {
        const errorDetails = parsed.error.format();
        logger.warn({ userId: user.id, errors: errorDetails }, `[Socket Inbound] Validation failed for ${WS_EVENTS.SUBSCRIBE_STOCKS}`);
        return ack({ success: false, error: 'Validation failed', details: errorDetails });
      }

      const { stockCodes } = parsed.data;
      const result = await clientActionService.subscribeStocks(user.id, stockCodes);

      if (result.success) {
        ack({ success: true, message: `Subscribed to ${result.subscribedTokens.length} stock tokens` });
      } else {
        ack({ success: false, error: result.reason });
      }
    } catch (error) {
      logger.error({ userId: user.id, error: error.message }, `[Socket Inbound] Failed to process ${WS_EVENTS.SUBSCRIBE_STOCKS}`);
      ack({ success: false, error: 'Internal server error' });
    }
  });

  // 2. unsubscribe:stocks
  socket.on(WS_EVENTS.UNSUBSCRIBE_STOCKS, async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    try {
      logger.info({ userId: user.id, socketId: socket.id, payload }, `[Socket Inbound] Received ${WS_EVENTS.UNSUBSCRIBE_STOCKS}`);

      // Validate payload structure
      const parsed = unsubscribeStocksSchema.safeParse(payload);
      if (!parsed.success) {
        const errorDetails = parsed.error.format();
        logger.warn({ userId: user.id, errors: errorDetails }, `[Socket Inbound] Validation failed for ${WS_EVENTS.UNSUBSCRIBE_STOCKS}`);
        return ack({ success: false, error: 'Validation failed', details: errorDetails });
      }

      const { stockCodes } = parsed.data;
      const result = await clientActionService.unsubscribeStocks(user.id, stockCodes);

      if (result.success) {
        ack({ success: true, message: `Unsubscribed from ${result.unsubscribedTokens.length} stock tokens` });
      } else {
        ack({ success: false, error: result.reason });
      }
    } catch (error) {
      logger.error({ userId: user.id, error: error.message }, `[Socket Inbound] Failed to process ${WS_EVENTS.UNSUBSCRIBE_STOCKS}`);
      ack({ success: false, error: 'Internal server error' });
    }
  });

  // 3. alerts:mark_seen
  socket.on(WS_EVENTS.ALERTS_MARK_SEEN, async (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    try {
      logger.info({ userId: user.id, socketId: socket.id, payload }, `[Socket Inbound] Received ${WS_EVENTS.ALERTS_MARK_SEEN}`);

      // Validate payload structure
      const parsed = alertsMarkSeenSchema.safeParse(payload);
      if (!parsed.success) {
        const errorDetails = parsed.error.format();
        logger.warn({ userId: user.id, errors: errorDetails }, `[Socket Inbound] Validation failed for ${WS_EVENTS.ALERTS_MARK_SEEN}`);
        return ack({ success: false, error: 'Validation failed', details: errorDetails });
      }

      const { alertId } = parsed.data;
      const result = await clientActionService.markAlertSeen(user.id, alertId);

      if (result.success) {
        ack({ success: true, message: 'Alert marked as seen', alert: result.alert });
      } else {
        ack({ success: false, error: result.reason });
      }
    } catch (error) {
      logger.error({ userId: user.id, alertId: payload?.alertId, error: error.message }, `[Socket Inbound] Failed to process ${WS_EVENTS.ALERTS_MARK_SEEN}`);
      ack({ success: false, error: 'Internal server error' });
    }
  });

  // 4. ping
  socket.on(WS_EVENTS.PING, (payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};
    logger.debug({ userId: user.id, socketId: socket.id }, '[Socket Inbound] Keepalive ping received');
    
    // Respond to custom ping immediately
    socket.emit('pong', { timestamp: Date.now() });
    ack({ success: true, timestamp: Date.now() });
  });
};
