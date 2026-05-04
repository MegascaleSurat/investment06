/**
 * @typedef {Object} MarketSnapshot
 * @property {'STRONG'|'NEUTRAL'|'WEAK'} marketStatus
 * @property {number} niftyChangePct
 * @property {number} midcapChangePct
 */

/**
 * @typedef {Object} StockSnapshot
 * @property {string} stockCode
 * @property {number} ltp
 * @property {number} entryPrice
 * @property {number} stopLoss
 * @property {number} volumeRatio
 * @property {'STRONG'|'NEUTRAL'|'WEAK'} sectorStatus
 * @property {number} holdingDays
 * @property {number} pnlPct
 * @property {number} stepPercent
 * @property {number} volumeWeakDays
 * @property {boolean} hasActivePosition
 */

/**
 * @typedef {Object} EntryDecision
 * @property {'BUY'|'BLOCK'|'WAIT'} action
 * @property {string} reason
 * @property {number} [quantity]
 */

/**
 * @typedef {Object} ExitDecision
 * @property {'EXIT'|'HOLD'|'TRAIL_SL'} action
 * @property {string} reason
 * @property {number} [newSl]
 */

/**
 * @typedef {Object} IStrategy
 * @property {function(Object): void} initialize
 * @property {function(StockSnapshot, MarketSnapshot): EntryDecision} evaluateEntry
 * @property {function(StockSnapshot, MarketSnapshot): ExitDecision} evaluateExit
 * @property {function(StockSnapshot): Object} managePosition
 */

// This file is for type definitions only.
export {};
