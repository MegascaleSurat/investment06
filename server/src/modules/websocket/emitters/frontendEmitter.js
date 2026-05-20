import { getIO } from '../index.js';
import { WS_EVENTS } from '../constants/events.js';
import logger from '../../../config/logger.js';
import {
  marketStatusSchema,
  sectorMetricsUpdateSchema,
  stockLtpSchema,
  stockEntryStatusSchema,
  stockConfirmationTimerSchema,
  tradeSignalSchema,
  tradeOrderUpdateSchema,
  tradePositionUpdateSchema,
  tradeExitTriggeredSchema,
  tradeClosedSchema,
  alertNewSchema,
  volumeSignalSchema,
  systemEngineHeartbeatSchema,
  systemErrorSchema
} from '../validators/frontendEvents.validation.js';

/**
 * Frontend Emitter
 * Handles outbound real-time events, enforcing payload schema validation using Zod.
 * Protects clients from receiving malformed or unvalidated broker/system payloads.
 */
class FrontendEmitter {
  constructor() {
    this._io = null;
  }

  /**
   * Lazy load the Socket.IO instance to avoid initialization cycle issues
   */
  get io() {
    if (!this._io) {
      this._io = getIO();
    }
    return this._io;
  }

  /**
   * Helper to validate payload
   */
  _validate(schema, eventName, payload) {
    const result = schema.safeParse(payload);
    if (!result.success) {
      logger.error(
        { eventName, errors: result.error.format(), payload },
        '[WS Emitter] Payload validation failed'
      );
      throw new Error(`Validation failed for event ${eventName}`);
    }
    return result.data;
  }

  // 1. Broadcast market_status update (STRONG / NEUTRAL / WEAK)
  emitMarketStatus(payload) {
    try {
      const validated = this._validate(marketStatusSchema, WS_EVENTS.MARKET_STATUS, payload);
      this.io.of('/ws').emit(WS_EVENTS.MARKET_STATUS, validated);
      logger.info({ status: validated.status }, '[WS Emitter] Market status broadcasted');
    } catch (error) {
      logger.error({ error: error.message }, '[WS Emitter] Failed to emit market:status');
    }
  }

  // 2. Push updated sector_metrics object (all sectors ranked) every 5 minutes
  emitSectorMetricsUpdate(payload) {
    try {
      const validated = this._validate(sectorMetricsUpdateSchema, WS_EVENTS.SECTOR_METRICS_UPDATE, payload);
      this.io.of('/ws').emit(WS_EVENTS.SECTOR_METRICS_UPDATE, validated);
      logger.info({ count: validated.sectors.length }, '[WS Emitter] Sector metrics update broadcasted');
    } catch (error) {
      logger.error({ error: error.message }, '[WS Emitter] Failed to emit sector:metrics:update');
    }
  }

  // 3. Stream live LTP, volume_ratio, price_change_pct per tracked stock
  emitStockLtp(userId, payload) {
    try {
      const validated = this._validate(stockLtpSchema, WS_EVENTS.STOCK_LTP, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.STOCK_LTP, validated);
      logger.debug({ userId, stockCode: validated.stockCode }, '[WS Emitter] Stock LTP update emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit stock:ltp');
    }
  }

  // 4. Push entry_status change (WAITING / BLOCKED / READY)
  emitStockEntryStatus(userId, payload) {
    try {
      const validated = this._validate(stockEntryStatusSchema, WS_EVENTS.STOCK_ENTRY_STATUS, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.STOCK_ENTRY_STATUS, validated);
      logger.info({ userId, stockCode: validated.stockCode, status: validated.status }, '[WS Emitter] Stock entry status change emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit stock:entry_status');
    }
  }

  // 5. Push 5-minute confirmation countdown tick per stock entering WAITING_CONFIRMATION state
  emitStockConfirmationTimer(userId, payload) {
    try {
      const validated = this._validate(stockConfirmationTimerSchema, WS_EVENTS.STOCK_CONFIRMATION_TIMER, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.STOCK_CONFIRMATION_TIMER, validated);
      logger.debug({ userId, stockCode: validated.stockCode, remaining: validated.secondsRemaining }, '[WS Emitter] Confirmation timer tick emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit stock:confirmation_timer');
    }
  }

  // 6. Notify frontend when BUY signal is generated
  emitTradeSignal(userId, payload) {
    try {
      const validated = this._validate(tradeSignalSchema, WS_EVENTS.TRADE_SIGNAL, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.TRADE_SIGNAL, validated);
      logger.info({ userId, stockCode: validated.stockCode, strategy: validated.strategy }, '[WS Emitter] Trade BUY signal emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit trade:signal');
    }
  }

  // 7. Stream order state changes (ORDER_PLACED -> FILLED / PARTIAL / REJECTED)
  emitTradeOrderUpdate(userId, payload) {
    try {
      const validated = this._validate(tradeOrderUpdateSchema, WS_EVENTS.TRADE_ORDER_UPDATE, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.TRADE_ORDER_UPDATE, validated);
      logger.info({ userId, symbol: validated.symbol, status: validated.status }, '[WS Emitter] Order update emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit trade:order_update');
    }
  }

  // 8. Push live position updates (pnl_pct, current_price, stop_loss, status) every 30s
  emitTradePositionUpdate(userId, payload) {
    try {
      const validated = this._validate(tradePositionUpdateSchema, WS_EVENTS.TRADE_POSITION_UPDATE, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.TRADE_POSITION_UPDATE, validated);
      logger.debug({ userId, stockCode: validated.stockCode, pnlPct: validated.pnlPct }, '[WS Emitter] Live position update emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit trade:position_update');
    }
  }

  // 9. Notify frontend when any exit rule fires
  emitTradeExitTriggered(userId, payload) {
    try {
      const validated = this._validate(tradeExitTriggeredSchema, WS_EVENTS.TRADE_EXIT_TRIGGERED, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.TRADE_EXIT_TRIGGERED, validated);
      logger.info({ userId, stockCode: validated.stockCode, reason: validated.exitReason }, '[WS Emitter] Trade exit triggered event emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit trade:exit_triggered');
    }
  }

  // 10. Notify frontend when trade reaches CLOSED state
  emitTradeClosed(userId, payload) {
    try {
      const validated = this._validate(tradeClosedSchema, WS_EVENTS.TRADE_CLOSED, payload);
      const room = `user:${userId}`;
      this.io.of('/ws').to(room).emit(WS_EVENTS.TRADE_CLOSED, validated);
      logger.info({ userId, stockCode: validated.stockCode, pnl: validated.finalPnlPct }, '[WS Emitter] Trade closed event emitted');
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit trade:closed');
    }
  }

  // 11. Push new alert to frontend in real time
  emitAlertNew(userId, payload) {
    try {
      const validated = this._validate(alertNewSchema, WS_EVENTS.ALERT_NEW, payload);
      if (userId) {
        const room = `user:${userId}`;
        this.io.of('/ws').to(room).emit(WS_EVENTS.ALERT_NEW, validated);
        logger.info({ userId, title: validated.title }, '[WS Emitter] User alert emitted');
      } else {
        // Broadcast global alert to everyone
        this.io.of('/ws').emit(WS_EVENTS.ALERT_NEW, validated);
        logger.info({ title: validated.title }, '[WS Emitter] Global alert broadcasted');
      }
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit alert:new');
    }
  }

  // 12. Push 15-minute volume signal result
  emitVolumeSignal(userId, payload) {
    try {
      const validated = this._validate(volumeSignalSchema, WS_EVENTS.VOLUME_SIGNAL, payload);
      if (userId) {
        const room = `user:${userId}`;
        this.io.of('/ws').to(room).emit(WS_EVENTS.VOLUME_SIGNAL, validated);
        logger.debug({ userId, stockCode: validated.stockCode }, '[WS Emitter] Volume signal emitted to user');
      } else {
        // Broadcast
        this.io.of('/ws').emit(WS_EVENTS.VOLUME_SIGNAL, validated);
        logger.debug({ stockCode: validated.stockCode }, '[WS Emitter] Volume signal broadcasted');
      }
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit volume:signal');
    }
  }

  // 13. Periodic heartbeat from each engine (sector, tracked, invested)
  emitSystemEngineHeartbeat(payload) {
    try {
      const validated = this._validate(systemEngineHeartbeatSchema, WS_EVENTS.SYSTEM_ENGINE_HEARTBEAT, payload);
      this.io.of('/ws').emit(WS_EVENTS.SYSTEM_ENGINE_HEARTBEAT, validated);
      logger.debug({ engine: validated.engineName, status: validated.status }, '[WS Emitter] Engine heartbeat broadcasted');
    } catch (error) {
      logger.error({ error: error.message }, '[WS Emitter] Failed to emit system:engine_heartbeat');
    }
  }

  // 14. Push critical system error to frontend
  emitSystemError(userId, payload) {
    try {
      const validated = this._validate(systemErrorSchema, WS_EVENTS.SYSTEM_ERROR, payload);
      if (userId) {
        const room = `user:${userId}`;
        this.io.of('/ws').to(room).emit(WS_EVENTS.SYSTEM_ERROR, validated);
        logger.warn({ userId, source: validated.source }, '[WS Emitter] System error emitted to user');
      } else {
        this.io.of('/ws').emit(WS_EVENTS.SYSTEM_ERROR, validated);
        logger.warn({ source: validated.source }, '[WS Emitter] Global system error broadcasted');
      }
    } catch (error) {
      logger.error({ error: error.message, userId }, '[WS Emitter] Failed to emit system:error');
    }
  }
}

export default new FrontendEmitter();
