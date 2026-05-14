import socketEmitter from '../emitters/user.emitter.js';
import { SOCKET_EVENTS } from '../constants/events.js';
import logger from '../../../config/logger.js';

/**
 * High-level WebSocket service for the application
 */
class WebSocketService {
  /**
   * Notify user about a trade update
   */
  notifyTradeUpdate(userId, tradeData) {
    socketEmitter.toUser(userId, SOCKET_EVENTS.TRADE_UPDATED, tradeData);
  }

  /**
   * Notify user about an order execution
   */
  notifyOrderExecuted(userId, orderData) {
    socketEmitter.toUser(userId, SOCKET_EVENTS.ORDER_EXECUTED, orderData);
  }

  /**
   * Notify user about a failed order
   */
  notifyOrderFailed(userId, errorData) {
    socketEmitter.toUser(userId, SOCKET_EVENTS.ORDER_FAILED, errorData);
  }

  /**
   * Send a general notification to a user
   */
  sendNotification(userId, title, message, type = 'info') {
    socketEmitter.toUser(userId, SOCKET_EVENTS.NOTIFICATION, {
      title,
      message,
      type,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast PnL update to a strategy room
   */
  broadcastStrategyPnL(strategyId, pnlData) {
    socketEmitter.toStrategy(strategyId, SOCKET_EVENTS.PNL_UPDATED, pnlData);
  }

  /**
   * Broadcast market tick
   */
  broadcastMarketTick(tickData) {
    socketEmitter.broadcastMarketTick(tickData);
  }
}

export default new WebSocketService();
