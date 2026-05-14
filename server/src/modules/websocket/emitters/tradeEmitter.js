import { getIO } from '../index.js';
import { WS_EVENTS } from '../constants/events.js';
import logger from '../../../config/logger.js';

/**
 * Trade Emitter
 * Handles outbound real-time notifications for trades, engine states, and market conditions.
 */
class TradeEmitter {
  /**
   * Emit Sector Status Change
   */
  emitSectorStatus(sectorName, status, affectedSignals = []) {
    const io = getIO();
    io.emit(WS_EVENTS.SECTOR_STATUS_CHANGE, {
      sectorName,
      status, // e.g., STRONG, WEAK
      timestamp: new Date(),
      affectedSignals
    });
    logger.info({ sectorName, status }, 'Sector status change broadcasted');
  }

  /**
   * Emit SL Updated Event
   */
  emitSlUpdated(userId, data) {
    const io = getIO();
    const roomName = `user:${userId}`;
    io.to(roomName).emit(WS_EVENTS.TRADE_SL_UPDATED, {
      stockCode: data.stockCode,
      oldSl: data.oldSl,
      newSl: data.newSl,
      reason: data.reason, // e.g., '5% hit', 'step_percent'
      timestamp: new Date()
    });
    logger.info({ userId, stockCode: data.stockCode }, 'SL update broadcasted to user');
  }

  /**
   * Emit Stock Cooldown Status
   */
  emitCooldownStatus(userId, stockCode, status, expiresAt) {
    const io = getIO();
    const roomName = `user:${userId}`;
    io.to(roomName).emit(WS_EVENTS.STOCK_COOLDOWN_STATUS, {
      stockCode,
      status, // ENTERED, EXITED
      expiresAt,
      timestamp: new Date()
    });
  }

  /**
   * Emit Confirmation Cancelled
   */
  emitConfirmationCancelled(userId, stockCode, reason) {
    const io = getIO();
    const roomName = `user:${userId}`;
    io.to(roomName).emit(WS_EVENTS.CONFIRMATION_CANCELLED, {
      stockCode,
      reason, // e.g., 'Price dropped below entry'
      timestamp: new Date()
    });
  }

  /**
   * Emit Engine State
   */
  emitEngineState(isPaused, reason, affectedEngines = []) {
    const io = getIO();
    const event = isPaused ? WS_EVENTS.ENGINE_PAUSED : WS_EVENTS.ENGINE_RESUMED;
    
    io.emit(event, {
      reason,
      affectedEngines,
      timestamp: new Date()
    });
    
    logger.info({ event, reason }, 'Engine state change broadcasted');
  }
}

export default new TradeEmitter();
