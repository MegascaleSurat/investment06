import { db } from '../../db/index.js';
import { stocks, marketDataDaily, marketDataIntraday, volumeData15min, signals } from '../../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

class DataRepository {
  /**
   * Fetch last N daily candles for a stock
   */
  async getDailyCandles(stockId, limit = 20) {
    return await db.select()
      .from(marketDataDaily)
      .where(eq(marketDataDaily.stockId, stockId))
      .orderBy(desc(marketDataDaily.date))
      .limit(limit);
  }

  /**
   * Fetch intraday candles for a stock on a specific date
   */
  async getIntradayCandles(stockId, date) {
    // Filter by date (UTC range or simple string match depending on timestamp format)
    // Assuming candleTime is TIMESTAMPTZ
    return await db.select()
      .from(marketDataIntraday)
      .where(
        and(
          eq(marketDataIntraday.stockId, stockId),
          sql`DATE(${marketDataIntraday.candleTime}) = ${date}`
        )
      )
      .orderBy(marketDataIntraday.candleTime);
  }

  /**
   * Fetch volume baseline for a stock
   */
  async getVolumeBaseline(stockId) {
    return await db.select()
      .from(volumeData15min)
      .where(eq(volumeData15min.stockId, stockId))
      .orderBy(desc(volumeData15min.intervalStart))
      .limit(50); // Get recent baseline slots
  }

  /**
   * Fetch latest live volume signals for all stocks
   */
  async getLatestLiveSignals() {
    return await db.select({
      id: signals.id,
      symbol: stocks.symbol,
      signalType: signals.signalType,
      signalScore: signals.signalScore,
      cumulativeRatio: signals.cumulativeRatio,
      cumulativeLiveVolume: signals.cumulativeLiveVolume,
      expectedCumulativeVolume: signals.expectedCumulativeVolume,
      status: signals.status,
      createdAt: signals.createdAt
    })
    .from(signals)
    .innerJoin(stocks, eq(signals.stockId, stocks.id))
    .where(eq(signals.status, 'TRIGGERED'))
    .orderBy(desc(signals.createdAt))
    .limit(100);
  }

  /**
   * Find stock by symbol
   */
  async findStockBySymbol(symbol) {
    const [record] = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    return record;
  }
}

export default new DataRepository();
