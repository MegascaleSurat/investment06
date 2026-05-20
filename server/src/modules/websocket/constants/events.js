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
  NOTIFICATION: 'notification',

  // --- New Realtime Events to Frontend ---
  MARKET_STATUS: 'market:status',
  SECTOR_METRICS_UPDATE: 'sector:metrics:update',
  STOCK_LTP: 'stock:ltp',
  STOCK_ENTRY_STATUS: 'stock:entry_status',
  STOCK_CONFIRMATION_TIMER: 'stock:confirmation_timer',
  TRADE_SIGNAL: 'trade:signal',
  TRADE_ORDER_UPDATE: 'trade:order_update',
  TRADE_POSITION_UPDATE: 'trade:position_update',
  TRADE_EXIT_TRIGGERED: 'trade:exit_triggered',
  TRADE_CLOSED: 'trade:closed',
  ALERT_NEW: 'alert:new',
  VOLUME_SIGNAL: 'volume:signal',
  SYSTEM_ENGINE_HEARTBEAT: 'system:engine_heartbeat',
  SYSTEM_ERROR: 'system:error',

  // Inbound Client Events
  SUBSCRIBE_STOCKS: 'subscribe:stocks',
  UNSUBSCRIBE_STOCKS: 'unsubscribe:stocks',
  ALERTS_MARK_SEEN: 'alerts:mark_seen',
  PING: 'ping'
};

export const INTERNAL_EVENTS = {
  MARKET_TICK_RECEIVED: 'market:tick:received',
  TRADE_COMPLETED: 'trade:completed',
  SIGNAL_GENERATED: 'signal:generated',
  SECTOR_FLIPPED: 'sector:flipped',
  SL_TRAILED: 'trade:sl:trailed',
  ENGINE_STATE_CHANGED: 'engine:state:changed',

  // Ticker connection state internal events
  TICKER_CONNECTED: 'market:ticker:connected',
  TICKER_DISCONNECTED: 'market:ticker:disconnected',
  TICKER_ERROR: 'market:ticker:error',
  TICKER_RECONNECTING: 'market:ticker:reconnecting',
  TICKER_NORECONNECT: 'market:ticker:noreconnect',
  ORDER_UPDATE_RECEIVED: 'market:order:update:received',

  // Ticker command events (server → Kite WS)
  TICKER_SUBSCRIBE: 'ticker:subscribe:requested',
  TICKER_UNSUBSCRIBE: 'ticker:unsubscribe:requested',
  TICKER_SET_MODE: 'ticker:setmode:requested',

  // --- New Internal Events ---
  MARKET_STATUS_UPDATED: 'market:status:updated',
  SECTOR_METRICS_UPDATED: 'sector:metrics:updated',
  STOCK_LTP_UPDATED: 'stock:ltp:updated',
  STOCK_ENTRY_STATUS_CHANGED: 'stock:entry:status_changed',
  STOCK_CONFIRMATION_TIMER_TICKED: 'stock:confirmation:timer_ticked',
  TRADE_SIGNAL_GENERATED: 'trade:signal:generated',
  TRADE_ORDER_UPDATED: 'trade:order:updated',
  TRADE_POSITION_UPDATED: 'trade:position:updated',
  TRADE_EXIT_TRIGGERED: 'trade:exit:triggered',
  TRADE_CLOSED_COMPLETED: 'trade:closed:completed',
  ALERT_NEW_RAISED: 'alert:new:raised',
  VOLUME_SIGNAL_PROCESSED: 'volume:signal:processed',
  SYSTEM_ENGINE_HEARTBEAT_RECEIVED: 'system:engine:heartbeat_received',
  SYSTEM_ERROR_OCCURRED: 'system:error:occurred'
};

/**
 * Socket.IO Specific Events
 */
export const SOCKET_EVENTS = {
  TRADE_UPDATED: 'trade:updated',
  ORDER_EXECUTED: 'order:executed',
  ORDER_FAILED: 'order:failed',
  NOTIFICATION: 'system:notification',
  PNL_UPDATED: 'pnl:updated',
  MARKET_TICK: 'market.tick',
  TICKER_STATUS: 'ticker.status'
};

/**
 * Socket.IO Rooms
 */
export const SOCKET_ROOMS = {
  USER: (userId) => `user:${userId}`,
  STRATEGY: (strategyId) => `strategy:${strategyId}`,
  PORTFOLIO: (portfolioId) => `portfolio:${portfolioId}`,
  MARKET: 'market'
};

/**
 * Kite Ticker Events
 */
export const TICKER_EVENTS = {
  CONNECT: 'ticker.connect',
  TICKS: 'ticker.ticks',
  DISCONNECT: 'ticker.disconnect',
  ERROR: 'ticker.error',
  RECONNECT: 'ticker.reconnect',
  NORECONNECT: 'ticker.noreconnect',
  ORDER_UPDATE: 'ticker.order_update'
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

