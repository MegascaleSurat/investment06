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
