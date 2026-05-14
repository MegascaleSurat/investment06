import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { historicalDailyData, stocks } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

/**
 * fetchHistoricalCandlesProcessor
 * 
 * Fetches last 20 daily candles from Kite for a single stock.
 * Called per-stock after watchlist upload.
 * Idempotent: upserts on (stockId, date) unique key.
 */
export const fetchHistoricalCandlesProcessor = async (job) => {
  const { stockId, userId, symbol, exchangeToken } = job.data;
  const jobId = job.id;

  logger.info({ jobId, stockId, symbol }, '[fetchHistoricalCandles] Job started');

  const kc = await kiteService._getKiteInstance(userId);

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30); // fetch 30 days, keep last 20 complete

  const candles = await kc.getHistoricalData(
    exchangeToken,
    'day',
    fromDate,
    toDate,
    false
  );

  if (!candles || candles.length === 0) {
    logger.warn({ jobId, stockId }, '[fetchHistoricalCandles] No candles returned from Kite');
    return { success: true, count: 0 };
  }

  // Only keep the last 20 complete daily candles
  const last20 = candles.slice(-20);

  for (const candle of last20) {
    await db.insert(historicalDailyData)
      .values({
        stockId,
        date: new Date(candle.date),
        open: String(candle.open),
        high: String(candle.high),
        low: String(candle.low),
        close: String(candle.close),
        volume: candle.volume
      })
      .onConflictDoUpdate({
        target: [historicalDailyData.stockId, historicalDailyData.date],
        set: {
          open: String(candle.open),
          high: String(candle.high),
          low: String(candle.low),
          close: String(candle.close),
          volume: candle.volume,
          updatedAt: new Date()
        }
      });
  }

  // Mark stock as historical data complete
  await db.update(stocks)
    .set({ historicalDataReady: true, updatedAt: new Date() })
    .where(eq(stocks.id, stockId));

  logger.info({ jobId, stockId, symbol, count: last20.length }, '[fetchHistoricalCandles] Completed');
  return { success: true, count: last20.length };
};
