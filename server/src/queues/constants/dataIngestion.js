/**
 * Data Ingestion Queue Names
 */
export const QUEUE_NAMES = {
  FETCH_HISTORICAL_CANDLES: 'fetch-historical-candles',
  FETCH_INTRADAY_CANDLES: 'fetch-intraday-candles',
  FETCH_LIVE_PRICE: 'fetch-live-price',
  FETCH_MARKET_INDEX: 'fetch-market-index',
  SYNC_KITE_INSTRUMENTS: 'sync-kite-instruments',
  RECONCILE_ORDERS: 'reconcile-orders',
};

/**
 * Job Names within each queue
 */
export const JOB_NAMES = {
  FETCH_CANDLES_FOR_STOCK: 'fetch-candles-for-stock',
  FETCH_15MIN_CANDLES: 'fetch-15min-candles',
  FETCH_LTP: 'fetch-ltp',
  FETCH_INDEX_QUOTE: 'fetch-index-quote',
  SYNC_INSTRUMENTS: 'sync-instruments',
  RECONCILE: 'reconcile-orders',
};

/**
 * Cron schedules — all in IST (UTC+5:30)
 */
export const CRON_SCHEDULES = {
  INTRADAY_CANDLES: '*/15 9-15 * * 1-5',       // every 15 min, 9–15h, Mon–Fri
  LIVE_PRICE: '* 9-15 * * 1-5',                 // every minute, 9–15h, Mon–Fri
  MARKET_INDEX: '*/5 9-15 * * 1-5',             // every 5 min, Mon–Fri
  SYNC_INSTRUMENTS: '0 3 * * 1-5',              // 08:30 IST = 03:00 UTC, Mon–Fri
  RECONCILE_ORDERS: '*/5 9-15 * * 1-5',         // every 5 min, Mon–Fri
};
