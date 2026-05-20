/**
 * WebSocket Integration Helpers
 * 
 * These are the public API for other system modules (engine, strategies, sectors)
 * to publish events to the WebSocket layer without importing Socket.IO directly.
 * 
 * Pattern: other modules call these → eventBus emits internally → handler picks it up → tradeEmitter broadcasts to clients
 */

import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS } from '../constants/events.js';
import tradeEmitter from '../emitters/tradeEmitter.js';

// =====================================================
// 1. SECTOR STATUS CHANGE
// Call from: Sector engine when sector flips STRONG ↔ WEAK
// =====================================================
export const publishSectorStatusChange = (sectorName, status, affectedSignals = []) => {
  eventBus.emit(INTERNAL_EVENTS.SECTOR_FLIPPED, { sectorName, status, affectedSignals });
};

// =====================================================
// 2. TRAILING SL UPDATED
// Call from: Trade engine when trailing SL steps up
// =====================================================
export const publishSlUpdated = (userId, stockCode, oldSl, newSl, reason) => {
  eventBus.emit(INTERNAL_EVENTS.SL_TRAILED, { userId, stockCode, oldSl, newSl, reason });
};

// =====================================================
// 3. STOCK COOLDOWN STATUS
// Call from: Trade service when trade closes (cooldown entered) or expires (cooldown exited)
// =====================================================
export const publishCooldownStatus = (userId, stockCode, status, expiresAt) => {
  tradeEmitter.emitCooldownStatus(userId, stockCode, status, expiresAt);
};

// =====================================================
// 4. CONFIRMATION CANCELLED
// Call from: Strategy engine when 5-min hold window price check fails
// =====================================================
export const publishConfirmationCancelled = (userId, stockCode, reason) => {
  tradeEmitter.emitConfirmationCancelled(userId, stockCode, reason);
};

// =====================================================
// 5 & 6. ENGINE PAUSED / RESUMED
// Call from: Maintenance service when engines are paused or resumed
// =====================================================
export const publishEnginePaused = (reason, affectedEngines) => {
  eventBus.emit(INTERNAL_EVENTS.ENGINE_STATE_CHANGED, { isPaused: true, reason, affectedEngines });
};

export const publishEngineResumed = (affectedEngines) => {
  eventBus.emit(INTERNAL_EVENTS.ENGINE_STATE_CHANGED, { isPaused: false, reason: null, affectedEngines });
};

// =====================================================
// TICKER COMMANDS (server → Kite WebSocket)
// =====================================================

// ticker.subscribe
// Call from: Watchlist service / Trade entry engine when new stock enters tracking
export const tickerSubscribe = (userId, tokens, mode) => {
  eventBus.emit(INTERNAL_EVENTS.TICKER_SUBSCRIBE, { userId, tokens, mode });
};

// ticker.unsubscribe
// Call from: Watchlist service / Trade exit engine when stock leaves all positions + watchlist
export const tickerUnsubscribe = (userId, tokens) => {
  eventBus.emit(INTERNAL_EVENTS.TICKER_UNSUBSCRIBE, { userId, tokens });
};

// ticker.setMode
// Call from: Trade engine on entry (upgrade LTP → FULL) or exit (downgrade FULL → LTP)
export const tickerSetMode = (userId, tokens, mode) => {
  eventBus.emit(INTERNAL_EVENTS.TICKER_SET_MODE, { userId, tokens, mode });
};

// =====================================================
// 14 NEW REALTIME EVENT PUBLISHERS
// =====================================================

/**
 * 1. Broadcast market_status update (STRONG / NEUTRAL / WEAK)
 */
export const publishMarketStatus = (status) => {
  eventBus.emit(INTERNAL_EVENTS.MARKET_STATUS_UPDATED, {
    status,
    timestamp: new Date()
  });
};

/**
 * 2. Push updated sector_metrics object (all sectors ranked)
 */
export const publishSectorMetrics = (sectors) => {
  eventBus.emit(INTERNAL_EVENTS.SECTOR_METRICS_UPDATED, {
    sectors,
    timestamp: new Date()
  });
};

/**
 * 3. Stream live LTP, volume_ratio, price_change_pct per tracked stock
 */
export const publishStockLtp = (userId, stockCode, ltp, volumeRatio, priceChangePct) => {
  eventBus.emit(INTERNAL_EVENTS.STOCK_LTP_UPDATED, {
    userId,
    payload: {
      stockCode,
      ltp,
      volumeRatio,
      priceChangePct,
      timestamp: new Date()
    }
  });
};

/**
 * 4. Push entry_status change (WAITING / BLOCKED / READY)
 */
export const publishStockEntryStatus = (userId, stockCode, status, reason = null) => {
  eventBus.emit(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, {
    userId,
    payload: {
      stockCode,
      status,
      reason,
      timestamp: new Date()
    }
  });
};

/**
 * 5. Push 5-minute confirmation countdown tick per stock
 */
export const publishStockConfirmationTimer = (userId, stockCode, secondsRemaining) => {
  eventBus.emit(INTERNAL_EVENTS.STOCK_CONFIRMATION_TIMER_TICKED, {
    userId,
    payload: {
      stockCode,
      secondsRemaining,
      timestamp: new Date()
    }
  });
};

/**
 * 6. Notify frontend when BUY signal is generated
 */
export const publishTradeSignal = (userId, stockCode, entryPrice, strategy, signalType = 'BUY') => {
  eventBus.emit(INTERNAL_EVENTS.TRADE_SIGNAL_GENERATED, {
    userId,
    payload: {
      stockCode,
      entryPrice,
      strategy,
      signalType,
      timestamp: new Date()
    }
  });
};

/**
 * 7. Stream order state changes (ORDER_PLACED -> FILLED / PARTIAL / REJECTED)
 */
export const publishTradeOrderUpdate = (userId, orderId, brokerOrderId, symbol, status, quantity, price, reason = null) => {
  eventBus.emit(INTERNAL_EVENTS.TRADE_ORDER_UPDATED, {
    userId,
    payload: {
      orderId,
      brokerOrderId,
      symbol,
      status,
      quantity,
      price,
      reason,
      timestamp: new Date()
    }
  });
};

/**
 * 8. Push live position updates (pnl_pct, current_price, stop_loss, status)
 */
export const publishTradePositionUpdate = (userId, positionId, stockCode, pnlPct, currentPrice, stopLoss, status) => {
  eventBus.emit(INTERNAL_EVENTS.TRADE_POSITION_UPDATED, {
    userId,
    payload: {
      positionId,
      stockCode,
      pnlPct,
      currentPrice,
      stopLoss,
      status,
      timestamp: new Date()
    }
  });
};

/**
 * 9. Notify frontend when any exit rule fires
 */
export const publishTradeExitTriggered = (userId, stockCode, exitReason, exitPrice = null) => {
  eventBus.emit(INTERNAL_EVENTS.TRADE_EXIT_TRIGGERED, {
    userId,
    payload: {
      stockCode,
      exitReason,
      exitPrice,
      timestamp: new Date()
    }
  });
};

/**
 * 10. Notify frontend when trade reaches CLOSED state
 */
export const publishTradeClosed = (userId, tradeId, stockCode, finalPnlPct, exitReason) => {
  eventBus.emit(INTERNAL_EVENTS.TRADE_CLOSED_COMPLETED, {
    userId,
    payload: {
      tradeId,
      stockCode,
      finalPnlPct,
      exitReason,
      timestamp: new Date()
    }
  });
};

/**
 * 11. Push new alert to frontend in real time
 */
export const publishAlertNew = (userId, alertId, title, message, severity) => {
  eventBus.emit(INTERNAL_EVENTS.ALERT_NEW_RAISED, {
    userId,
    payload: {
      alertId,
      title,
      message,
      severity,
      timestamp: new Date()
    }
  });
};

/**
 * 12. Push 15-minute volume signal result
 */
export const publishVolumeSignal = (userId, stockCode, slotRatio, cumulativeRatio, status) => {
  eventBus.emit(INTERNAL_EVENTS.VOLUME_SIGNAL_PROCESSED, {
    userId,
    payload: {
      stockCode,
      slotRatio,
      cumulativeRatio,
      status,
      timestamp: new Date()
    }
  });
};

/**
 * 13. Periodic heartbeat from each engine (sector, tracked, invested)
 */
export const publishSystemEngineHeartbeat = (engineName, lastRun, status, metadata = null) => {
  eventBus.emit(INTERNAL_EVENTS.SYSTEM_ENGINE_HEARTBEAT_RECEIVED, {
    engineName,
    lastRun,
    status,
    metadata,
    timestamp: new Date()
  });
};

/**
 * 14. Push critical system error to frontend
 */
export const publishSystemError = (userId, code, message, source) => {
  eventBus.emit(INTERNAL_EVENTS.SYSTEM_ERROR_OCCURRED, {
    userId,
    payload: {
      code,
      message,
      source,
      timestamp: new Date()
    }
  });
};
