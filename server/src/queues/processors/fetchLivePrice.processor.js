import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { stocks } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * fetchLivePriceProcessor
 * 
 * Runs every 1 min during market hours.
 * Fallback for when WebSocket ticker is unavailable / reconnecting.
 * Pulls LTP, prev_close, and volume from Kite REST quote API.
 */
export const fetchLivePriceProcessor = async (job) => {
  const { userId } = job.data;
  const jobId = job.id;

  logger.info({ jobId, userId }, '[fetchLivePrice] Job started');

  const kc = await kiteService._getKiteInstance(userId);

  const trackedStocks = await db.select({
    id: stocks.id,
    symbol: stocks.symbol,
    exchange: stocks.exchange
  })
  .from(stocks)
  .where(eq(stocks.isTracked, true));

  if (!trackedStocks.length) return { success: true };

  // Build Kite-format instrument keys: "NSE:RELIANCE"
  const instrumentKeys = trackedStocks.map(s => `${s.exchange || 'NSE'}:${s.symbol}`);

  const quotes = await kc.getQuote(instrumentKeys);

  let updated = 0;
  for (const stock of trackedStocks) {
    const key = `${stock.exchange || 'NSE'}:${stock.symbol}`;
    const quote = quotes[key];
    if (!quote) continue;

    await db.update(stocks).set({
      lastPrice: String(quote.last_price),
      prevClose: String(quote.ohlc?.close || 0),
      volume: quote.volume,
      updatedAt: new Date()
    }).where(eq(stocks.id, stock.id));

    updated++;
  }

  logger.info({ jobId, updated }, '[fetchLivePrice] Completed');
  return { success: true, updated };
};
