import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { marketMetrics } from '../../db/schema/index.js';

// Nifty 50 and Midcap 100 exchange tokens (NSE indices)
const INDEX_INSTRUMENTS = [
  { key: 'NSE:NIFTY 50',     name: 'NIFTY_50' },
  { key: 'NSE:NIFTY MIDCAP 100', name: 'NIFTY_MIDCAP_100' },
];

/**
 * fetchMarketIndexProcessor
 * 
 * Runs every 5 min during market hours.
 * Fetches Nifty 50 and Midcap 100 LTP + prev_close.
 * Upserts into market_metrics table used by the market status engine.
 */
export const fetchMarketIndexProcessor = async (job) => {
  const { userId } = job.data;
  const jobId = job.id;

  logger.info({ jobId }, '[fetchMarketIndex] Job started');

  const kc = await kiteService._getKiteInstance(userId);

  const keys = INDEX_INSTRUMENTS.map(i => i.key);
  const quotes = await kc.getQuote(keys);

  for (const idx of INDEX_INSTRUMENTS) {
    const quote = quotes[idx.key];
    if (!quote) continue;

    await db.insert(marketMetrics)
      .values({
        indexName: idx.name,
        lastPrice: String(quote.last_price),
        prevClose: String(quote.ohlc?.close || 0),
        change: String(quote.change || 0),
        changePercent: String(quote.change_percent || 0),
        recordedAt: new Date()
      })
      .onConflictDoUpdate({
        target: marketMetrics.indexName,
        set: {
          lastPrice: String(quote.last_price),
          prevClose: String(quote.ohlc?.close || 0),
          change: String(quote.change || 0),
          changePercent: String(quote.change_percent || 0),
          recordedAt: new Date()
        }
      });
  }

  logger.info({ jobId }, '[fetchMarketIndex] Completed');
  return { success: true };
};
