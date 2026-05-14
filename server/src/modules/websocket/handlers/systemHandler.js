import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS } from '../constants/events.js';
import tradeEmitter from '../emitters/tradeEmitter.js';
import logger from '../../../config/logger.js';

/**
 * System Event Handler
 * Bridges internal event bus signals to the TradeEmitter for Socket.IO broadcasting.
 */
export const registerSystemHandler = () => {
  // 1. Sector Flipped
  eventBus.on(INTERNAL_EVENTS.SECTOR_FLIPPED, (data) => {
    tradeEmitter.emitSectorStatus(data.sectorName, data.status, data.affectedSignals);
  });

  // 2. SL Trailed
  eventBus.on(INTERNAL_EVENTS.SL_TRAILED, (data) => {
    tradeEmitter.emitSlUpdated(data.userId, data);
  });

  // 3. Engine State Changed
  eventBus.on(INTERNAL_EVENTS.ENGINE_STATE_CHANGED, (data) => {
    tradeEmitter.emitEngineState(data.isPaused, data.reason, data.affectedEngines);
  });

  logger.info('System WebSocket handlers registered');
};
