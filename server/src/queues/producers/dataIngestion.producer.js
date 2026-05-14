import { createQueue } from '../../config/queue.js';
import { QUEUE_NAMES, JOB_NAMES, CRON_SCHEDULES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

// Initialize Queues
const fetchHistoricalCandlesQueue = createQueue(QUEUE_NAMES.FETCH_HISTORICAL_CANDLES);
const fetchIntradayCandlesQueue = createQueue(QUEUE_NAMES.FETCH_INTRADAY_CANDLES);
const fetchLivePriceQueue = createQueue(QUEUE_NAMES.FETCH_LIVE_PRICE);
const fetchMarketIndexQueue = createQueue(QUEUE_NAMES.FETCH_MARKET_INDEX);
const syncKiteInstrumentsQueue = createQueue(QUEUE_NAMES.SYNC_KITE_INSTRUMENTS);
const reconcileOrdersQueue = createQueue(QUEUE_NAMES.RECONCILE_ORDERS);

/**
 * Schedule all recurring cron jobs
 * Call this on application startup
 */
export const scheduleDataIngestionCronJobs = async (userId) => {
  if (!fetchIntradayCandlesQueue) {
    logger.warn('Redis disabled. Cron jobs not scheduled.');
    return;
  }

  try {
    // 1. Intraday Candles (Every 15m)
    await fetchIntradayCandlesQueue.add(
      JOB_NAMES.FETCH_15MIN_CANDLES,
      { userId },
      { repeat: { pattern: CRON_SCHEDULES.INTRADAY_CANDLES }, jobId: 'cron-intraday' }
    );

    // 2. Live Price Fallback (Every 1m)
    await fetchLivePriceQueue.add(
      JOB_NAMES.FETCH_LTP,
      { userId },
      { repeat: { pattern: CRON_SCHEDULES.LIVE_PRICE }, jobId: 'cron-live-price' }
    );

    // 3. Market Index (Every 5m)
    await fetchMarketIndexQueue.add(
      JOB_NAMES.FETCH_INDEX_QUOTE,
      { userId },
      { repeat: { pattern: CRON_SCHEDULES.MARKET_INDEX }, jobId: 'cron-market-index' }
    );

    // 4. Instruments Sync (Daily 08:30)
    await syncKiteInstrumentsQueue.add(
      JOB_NAMES.SYNC_INSTRUMENTS,
      { userId },
      { repeat: { pattern: CRON_SCHEDULES.SYNC_INSTRUMENTS }, jobId: 'cron-sync-instruments' }
    );

    // 5. Order Reconciliation (Every 5m)
    await reconcileOrdersQueue.add(
      JOB_NAMES.RECONCILE,
      { userId },
      { repeat: { pattern: CRON_SCHEDULES.RECONCILE_ORDERS }, jobId: 'cron-reconcile-orders' }
    );

    logger.info('🕒 Data ingestion cron jobs successfully scheduled');
  } catch (error) {
    logger.error('❌ Failed to schedule data ingestion cron jobs:', error);
  }
};

/**
 * Trigger historical candle fetch for a single stock
 * Call this when a new stock is added to the watchlist
 */
export const triggerHistoricalCandleFetch = async (userId, stockId, symbol, exchangeToken) => {
  if (!fetchHistoricalCandlesQueue) return;

  try {
    await fetchHistoricalCandlesQueue.add(
      JOB_NAMES.FETCH_CANDLES_FOR_STOCK,
      { userId, stockId, symbol, exchangeToken },
      { 
        jobId: `hist-candles-${stockId}-${Date.now()}`, // Unique job ID
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );
    logger.info(`Queued historical candle fetch for ${symbol}`);
  } catch (error) {
    logger.error(`Failed to queue historical candles for ${symbol}:`, error);
  }
};
