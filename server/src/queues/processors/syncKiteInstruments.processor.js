import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { db } from '../../db/index.js';
import { stocks } from '../../db/schema/index.js';
import { eq, inArray } from 'drizzle-orm';

/**
 * syncKiteInstrumentsProcessor
 * 
 * Runs daily at 08:30 IST before market open.
 * Downloads the full NSE instruments dump from Kite.
 * Updates instrument_key (exchange_token) in stocks table
 * for all tracked stocks. Critical for historical data fetches.
 */
export const syncKiteInstrumentsProcessor = async (job) => {
  const { userId } = job.data;
  const jobId = job.id;

  logger.info({ jobId }, '[syncKiteInstruments] Job started');

  const kc = await kiteService._getKiteInstance(userId);

  // Download all NSE instruments
  const instruments = await kc.getInstruments('NSE');

  if (!instruments || instruments.length === 0) {
    throw new Error('[syncKiteInstruments] No instruments returned from Kite');
  }

  // Fetch all tracked stocks to match against
  const trackedStocks = await db.select({
    id: stocks.id,
    symbol: stocks.symbol
  })
  .from(stocks)
  .where(eq(stocks.isTracked, true));

  // Build symbol → exchange_token map from Kite dump
  const kiteMap = {};
  for (const inst of instruments) {
    kiteMap[inst.tradingsymbol] = inst.instrument_token;
  }

  let updated = 0;
  for (const stock of trackedStocks) {
    const token = kiteMap[stock.symbol];
    if (!token) {
      logger.warn({ symbol: stock.symbol }, '[syncKiteInstruments] Symbol not found in Kite dump');
      continue;
    }

    await db.update(stocks)
      .set({ exchangeToken: String(token), updatedAt: new Date() })
      .where(eq(stocks.id, stock.id));

    updated++;
  }

  logger.info({ jobId, updated }, '[syncKiteInstruments] Completed');
  return { success: true, updated };
};
