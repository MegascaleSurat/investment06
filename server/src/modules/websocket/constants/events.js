/**
 * Standardized WebSocket and Internal Event Names
 */
export const WS_EVENTS = {
  // Connection Events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Market Data Events (Ticker)
  TICKER_MESSAGE: 'ticker.message', // Raw message from Kite
  MARKET_TICK: 'market.tick',      // Processed tick for clients
  
  // Sector & Signals
  SECTOR_STATUS_CHANGE: 'sector:status_change',
  STOCK_COOLDOWN_STATUS: 'stock:cooldown_status',
  CONFIRMATION_CANCELLED: 'stock:confirmation_cancelled',

  // Trade Events
  TRADE_EXECUTED: 'trade.executed',
  POSITION_UPDATED: 'position.updated',
  ORDER_UPDATE: 'order.update',
  TRADE_SL_UPDATED: 'trade:sl_updated',

  // System Events
  ENGINE_STATUS: 'engine.status',
  ENGINE_PAUSED: 'engine:paused',
  ENGINE_RESUMED: 'engine:resumed',
  NOTIFICATION: 'notification'
};

export const INTERNAL_EVENTS = {
  MARKET_TICK_RECEIVED: 'market:tick:received',
  TRADE_COMPLETED: 'trade:completed',
  SIGNAL_GENERATED: 'signal:generated',
  SECTOR_FLIPPED: 'sector:flipped',
  SL_TRAILED: 'trade:sl:trailed',
  ENGINE_STATE_CHANGED: 'engine:state:changed',

  // Ticker command events (server → Kite WS)
  TICKER_SUBSCRIBE: 'ticker:subscribe:requested',
  TICKER_UNSUBSCRIBE: 'ticker:unsubscribe:requested',
  TICKER_SET_MODE: 'ticker:setmode:requested',
};

/**
 * Kite Ticker Modes
 * LTP     → Only last traded price (minimal bandwidth, for tracked/watchlist stocks)
 * QUOTE   → LTP + OHLC + depth (5 levels)
 * FULL    → LTP + OHLC + depth + OI (for actively invested positions)
 */
export const TICKER_MODES = {
  LTP: 'ltp',
  QUOTE: 'quote',
  FULL: 'full',
};
