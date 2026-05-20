import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS } from '../constants/events.js';
import frontendEmitter from '../emitters/frontendEmitter.js';
import logger from '../../../config/logger.js';

/**
 * Frontend Event Handler
 * Listens for internal system/engine event bus signals and forwards them to
 * FrontendEmitter for Zod validation and client Socket.IO delivery.
 */
export const registerFrontendHandler = () => {
  // 1. market:status:updated
  eventBus.on(INTERNAL_EVENTS.MARKET_STATUS_UPDATED, (payload) => {
    logger.debug('[FrontendHandler] Received internal market status update');
    frontendEmitter.emitMarketStatus(payload);
  });

  // 2. sector:metrics:updated
  eventBus.on(INTERNAL_EVENTS.SECTOR_METRICS_UPDATED, (payload) => {
    logger.debug('[FrontendHandler] Received internal sector metrics update');
    frontendEmitter.emitSectorMetricsUpdate(payload);
  });

  // 3. stock:ltp:updated
  eventBus.on(INTERNAL_EVENTS.STOCK_LTP_UPDATED, ({ userId, payload }) => {
    logger.debug({ userId }, '[FrontendHandler] Received internal stock LTP update');
    frontendEmitter.emitStockLtp(userId, payload);
  });

  // 4. stock:entry:status_changed
  eventBus.on(INTERNAL_EVENTS.STOCK_ENTRY_STATUS_CHANGED, ({ userId, payload }) => {
    logger.debug({ userId }, '[FrontendHandler] Received internal stock entry status change');
    frontendEmitter.emitStockEntryStatus(userId, payload);
  });

  // 5. stock:confirmation:timer_ticked
  eventBus.on(INTERNAL_EVENTS.STOCK_CONFIRMATION_TIMER_TICKED, ({ userId, payload }) => {
    logger.debug({ userId }, '[FrontendHandler] Received internal stock confirmation timer tick');
    frontendEmitter.emitStockConfirmationTimer(userId, payload);
  });

  // 6. trade:signal:generated
  eventBus.on(INTERNAL_EVENTS.TRADE_SIGNAL_GENERATED, ({ userId, payload }) => {
    logger.info({ userId }, '[FrontendHandler] Received internal trade signal generated');
    frontendEmitter.emitTradeSignal(userId, payload);
  });

  // 7. trade:order:updated
  eventBus.on(INTERNAL_EVENTS.TRADE_ORDER_UPDATED, ({ userId, payload }) => {
    logger.info({ userId }, '[FrontendHandler] Received internal order status update');
    frontendEmitter.emitTradeOrderUpdate(userId, payload);
  });

  // 8. trade:position:updated
  eventBus.on(INTERNAL_EVENTS.TRADE_POSITION_UPDATED, ({ userId, payload }) => {
    logger.debug({ userId }, '[FrontendHandler] Received internal position status update');
    frontendEmitter.emitTradePositionUpdate(userId, payload);
  });

  // 9. trade:exit:triggered
  eventBus.on(INTERNAL_EVENTS.TRADE_EXIT_TRIGGERED, ({ userId, payload }) => {
    logger.info({ userId }, '[FrontendHandler] Received internal trade exit triggered');
    frontendEmitter.emitTradeExitTriggered(userId, payload);
  });

  // 10. trade:closed:completed
  eventBus.on(INTERNAL_EVENTS.TRADE_CLOSED_COMPLETED, ({ userId, payload }) => {
    logger.info({ userId }, '[FrontendHandler] Received internal trade closed event');
    frontendEmitter.emitTradeClosed(userId, payload);
  });

  // 11. alert:new:raised
  eventBus.on(INTERNAL_EVENTS.ALERT_NEW_RAISED, ({ userId, payload }) => {
    logger.info({ userId }, '[FrontendHandler] Received internal alert raised');
    frontendEmitter.emitAlertNew(userId, payload);
  });

  // 12. volume:signal:processed
  eventBus.on(INTERNAL_EVENTS.VOLUME_SIGNAL_PROCESSED, ({ userId, payload }) => {
    logger.debug({ userId }, '[FrontendHandler] Received internal volume signal processed');
    frontendEmitter.emitVolumeSignal(userId, payload);
  });

  // 13. system:engine:heartbeat_received
  eventBus.on(INTERNAL_EVENTS.SYSTEM_ENGINE_HEARTBEAT_RECEIVED, (payload) => {
    logger.debug('[FrontendHandler] Received internal system engine heartbeat');
    frontendEmitter.emitSystemEngineHeartbeat(payload);
  });

  // 14. system:error:occurred
  eventBus.on(INTERNAL_EVENTS.SYSTEM_ERROR_OCCURRED, ({ userId, payload }) => {
    logger.warn({ userId }, '[FrontendHandler] Received internal system error occurred');
    frontendEmitter.emitSystemError(userId, payload);
  });

  logger.info('Frontend WebSocket event handlers registered successfully');
};
