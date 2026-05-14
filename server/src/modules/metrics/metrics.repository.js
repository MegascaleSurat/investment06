import { db } from '../../db/index.js';
import { 
  marketMetrics, 
  stockMetrics, 
  sectorMetrics, 
  stocks, 
  sectors,
  signals,
  entrySignals
} from '../../db/schema/index.js';
import { eq, desc, and, sql } from 'drizzle-orm';

class MetricsRepository {
  /**
   * Get latest market metrics
   */
  async getLatestMarketMetrics() {
    const [record] = await db.select()
      .from(marketMetrics)
      .orderBy(desc(marketMetrics.updatedAt))
      .limit(1);
    return record;
  }

  /**
   * Get all sector metrics ranked
   */
  async getSectorMetrics() {
    return await db.select({
      id: sectorMetrics.id,
      sectorId: sectorMetrics.sectorId,
      name: sectors.name,
      sectorReturnPct: sectorMetrics.sectorReturnPct,
      breadthPct: sectorMetrics.breadthPct,
      avgVolumeRatio: sectorMetrics.avgVolumeRatio,
      outperformancePct: sectorMetrics.outperformancePct,
      sectorStatus: sectorMetrics.sectorStatus,
      rank: sectorMetrics.rank,
      updatedAt: sectorMetrics.updatedAt
    })
    .from(sectorMetrics)
    .innerJoin(sectors, eq(sectorMetrics.sectorId, sectors.id))
    .orderBy(sectorMetrics.rank);
  }

  /**
   * Get metrics for all stocks
   */
  async getAllStockMetrics() {
    return await db.select({
      id: stockMetrics.id,
      stockId: stockMetrics.stockId,
      symbol: stocks.symbol,
      name: stocks.name,
      priceChangePct: stockMetrics.priceChangePct,
      avg10dVolume: stockMetrics.avg10dVolume,
      volumeRatio: stockMetrics.volumeRatio,
      stockStatus: stockMetrics.stockStatus,
      updatedAt: stockMetrics.updatedAt
    })
    .from(stockMetrics)
    .innerJoin(stocks, eq(stockMetrics.stockId, stocks.id))
    .orderBy(desc(stockMetrics.volumeRatio));
  }

  /**
   * Get metrics for a single stock by symbol
   */
  async getStockMetricsBySymbol(symbol) {
    const [record] = await db.select({
      id: stockMetrics.id,
      symbol: stocks.symbol,
      name: stocks.name,
      priceChangePct: stockMetrics.priceChangePct,
      volumeRatio: stockMetrics.volumeRatio,
      stockStatus: stockMetrics.stockStatus,
      updatedAt: stockMetrics.updatedAt
    })
    .from(stockMetrics)
    .innerJoin(stocks, eq(stockMetrics.stockId, stocks.id))
    .where(eq(stocks.symbol, symbol));
    return record;
  }

  /**
   * Get comprehensive Tracked Stock Screen data
   */
  async getTrackedStocksData() {
    return await db.select({
      symbol: stocks.symbol,
      name: stocks.name,
      priceChangePct: stockMetrics.priceChangePct,
      volumeRatio: stockMetrics.volumeRatio,
      stockStatus: stockMetrics.stockStatus,
      sectorName: sectors.name,
      sectorStatus: sectorMetrics.sectorStatus,
      entryStatus: signals.status,
      signalStatus: signals.signalStatus,
      confirmationStatus: entrySignals.status,
      signalScore: signals.signalScore
    })
    .from(stocks)
    .leftJoin(stockMetrics, eq(stocks.id, stockMetrics.stockId))
    .leftJoin(sectors, eq(stocks.sectorId, sectors.id))
    .leftJoin(sectorMetrics, eq(sectors.id, sectorMetrics.sectorId))
    .leftJoin(signals, eq(stocks.id, signals.stockId))
    .leftJoin(entrySignals, eq(signals.id, entrySignals.signalId))
    // Filter for active or recently signaled stocks
    .where(sql`${stocks.status} = 'ACTIVE'`)
    .orderBy(desc(stockMetrics.volumeRatio));
  }
}

export default new MetricsRepository();
