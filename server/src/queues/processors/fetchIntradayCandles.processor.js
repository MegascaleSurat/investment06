import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { intradayCandles, stocks } from '../../db/schema/index.js';

/**
 * fetchIntradayCandlesProcessor
 * 
 * Runs every 15 min during market hours.
 * Fetches the most recently completed 15-min candle for all tracked stocks.
 * Upserts on (stockId, datetime) to prevent duplicates on retry.
 */
export const fetchIntradayCandlesProcessor = async (job) => {
  const { userId } = job.data;
  const jobId = job.id;

  logger.info({ jobId, userId }, '[fetchIntradayCandles] Job started');

  const kc = await kiteService._getKiteInstance(userId);

  // Get all tracked stocks with exchangeToken
  const trackedStocks = await db.select({
    id: stocks.id,
    symbol: stocks.symbol,
    exchangeToken: stocks.exchangeToken
  })
  .from(stocks)
  .where(eq(stocks.isTracked, true));

  if (!trackedStocks.length) {
    logger.info({ jobId }, '[fetchIntradayCandles] No tracked stocks found');
    return { success: true, count: 0 };
  }

  const now = new Date();
  const fromDate = new Date(now.getTime() - 16 * 60 * 1000); // Last 16 min window

  let inserted = 0;
  for (const stock of trackedStocks) {
    try {
      const candles = await kc.getHistoricalData(
        stock.exchangeToken,
        '15minute',
        fromDate,
        now,
        false
      );

      for (const candle of candles) {
        await db.insert(intradayCandles)
          .values({
            stockId: stock.id,
            interval: '15minute',
            datetime: new Date(candle.date),
            open: String(candle.open),
            high: String(candle.high),
            low: String(candle.low),
            close: String(candle.close),
            volume: candle.volume
          })
          .onConflictDoNothing();
        inserted++;
      }
    } catch (err) {
      logger.warn({ jobId, symbol: stock.symbol, error: err.message }, '[fetchIntradayCandles] Skipped stock');
    }
  }

  logger.info({ jobId, inserted }, '[fetchIntradayCandles] Completed');
  return { success: true, inserted };
};
