import { db } from '../../db/index.js';
import { 
  stocks, 
  stockMetrics, 
  sectorMetrics, 
  marketMetrics, 
  sectors 
} from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import logger from '../../config/logger.js';

class CalcMetricsService {
  /**
   * 1. calcAvgVolume
   * Calculates avg_10d_volume for every stock by averaging the last 10 daily volumes
   * from market_data_daily and stores/updates it in stock_metrics.
   */
  async calcAvgVolume() {
    logger.info('[CalcMetricsService] Starting calcAvgVolume calculation...');
    try {
      // Computes the average volume of the last 10 days of candles per stock and upserts it.
      await db.execute(sql`
        WITH last_10_daily AS (
          SELECT stock_id, volume,
                 ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY date DESC) as rn
          FROM market_data_daily
        ),
        averages AS (
          SELECT stock_id, ROUND(AVG(volume))::bigint as avg_vol
          FROM last_10_daily
          WHERE rn <= 10
          GROUP BY stock_id
        )
        INSERT INTO stock_metrics (stock_id, avg_10d_volume, updated_at)
        SELECT stock_id, avg_vol, NOW()
        FROM averages
        ON CONFLICT (stock_id) DO UPDATE
        SET avg_10d_volume = EXCLUDED.avg_10d_volume,
            updated_at = NOW();
      `);
      logger.info('[CalcMetricsService] Completed calcAvgVolume successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcAvgVolume:', error);
      throw error;
    }
  }

  /**
   * 2. calcVolumeRatio
   * Calculates volume_ratio = today_volume / avg_10d_volume for every tracked stock
   * using live_price_data (market_data_live) and updates stock_metrics.
   */
  async calcVolumeRatio() {
    logger.info('[CalcMetricsService] Starting calcVolumeRatio calculation...');
    try {
      await db.execute(sql`
        WITH live_volumes AS (
          SELECT l.stock_id, l.today_volume, m.avg_10d_volume
          FROM market_data_live l
          INNER JOIN stock_metrics m ON l.stock_id = m.stock_id
          INNER JOIN stocks s ON l.stock_id = s.id
          WHERE s.is_tracked = true AND s.is_active = true
        )
        UPDATE stock_metrics
        SET volume_ratio = CASE 
              WHEN live_volumes.avg_10d_volume > 0 THEN ROUND((live_volumes.today_volume::numeric / live_volumes.avg_10d_volume::numeric), 4)
              ELSE 0.0000 
            END,
            updated_at = NOW()
        FROM live_volumes
        WHERE stock_metrics.stock_id = live_volumes.stock_id;
      `);
      logger.info('[CalcMetricsService] Completed calcVolumeRatio successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcVolumeRatio:', error);
      throw error;
    }
  }

  /**
   * 3. calcSlotVolumeBaseline
   * Recalculates 10-day and 20-day same-slot average volumes for each 15-min time slot
   * per stock from market_data_intraday (excluding today) and updates volume_data_15min.
   */
  async calcSlotVolumeBaseline() {
    logger.info('[CalcMetricsService] Starting calcSlotVolumeBaseline calculation...');
    try {
      await db.execute(sql`
        WITH slot_data AS (
          SELECT stock_id, 
                 candle_time::time as slot_time, 
                 volume,
                 ROW_NUMBER() OVER (PARTITION BY stock_id, candle_time::time ORDER BY candle_time DESC) as rn
          FROM market_data_intraday
          WHERE candle_time < CURRENT_DATE
        ),
        baselines AS (
          SELECT stock_id,
                 slot_time,
                 ROUND(AVG(volume) FILTER (WHERE rn <= 10))::bigint as avg_10d,
                 ROUND(AVG(volume) FILTER (WHERE rn <= 20))::bigint as avg_20d,
                 MAX(volume) FILTER (WHERE rn <= 10)::bigint as max_10d,
                 MIN(volume) FILTER (WHERE rn <= 10)::bigint as min_10d
          FROM slot_data
          GROUP BY stock_id, slot_time
        )
        UPDATE volume_data_15min v
        SET avg_volume_10d = b.avg_10d,
            avg_volume_20d = b.avg_20d,
            max_volume_10d = b.max_10d,
            min_volume_10d = b.min_10d
        FROM baselines b
        WHERE v.stock_id = b.stock_id
          AND v.interval_start::time = b.slot_time
          AND v.interval_start >= CURRENT_DATE;
      `);
      logger.info('[CalcMetricsService] Completed calcSlotVolumeBaseline successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcSlotVolumeBaseline:', error);
      throw error;
    }
  }

  /**
   * 4. calcSlotVolumeRatio
   * Computes slot_volume_ratio and cumulative_ratio for each tracked stock by comparing
   * live 15-min candle volume against volume_baseline.
   */
  async calcSlotVolumeRatio() {
    logger.info('[CalcMetricsService] Starting calcSlotVolumeRatio calculation...');
    try {
      // 1. Update the volume_ratio and is_spike columns in volume_data_15min for today's active candles
      await db.execute(sql`
        UPDATE volume_data_15min
        SET volume_ratio = CASE 
              WHEN avg_volume_10d > 0 THEN ROUND((volume::numeric / avg_volume_10d::numeric), 4)
              ELSE 1.0000 
            END,
            is_spike = CASE 
              WHEN avg_volume_10d > 0 AND (volume::numeric / avg_volume_10d::numeric) >= 2.0 THEN 1
              ELSE 0
            END
        WHERE interval_start >= CURRENT_DATE;
      `);

      // 2. Fetch the spikes for today to emit signals
      const spikes = await db.execute(sql`
        SELECT v.stock_id, s.symbol, v.volume_ratio, v.volume, v.avg_volume_10d, v.interval_start
        FROM volume_data_15min v
        INNER JOIN stocks s ON v.stock_id = s.id
        WHERE v.interval_start >= CURRENT_DATE AND v.is_spike = 1 AND s.is_tracked = true;
      `);

      // Dynamically import to avoid circular references
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      spikes.forEach(row => {
        eventBus.emit(INTERNAL_EVENTS.VOLUME_SIGNAL_PROCESSED, {
          userId: 'broadcast',
          payload: {
            stockCode: row.symbol,
            slotRatio: parseFloat(row.volume_ratio) || 0.0,
            cumulativeRatio: parseFloat(row.volume_ratio) || 0.0,
            status: 'BULLISH',
            timestamp: row.interval_start || new Date()
          }
        });
      });

      logger.info({ spikesCount: spikes.length }, '[CalcMetricsService] Completed calcSlotVolumeRatio successfully');
      return { success: true, spikesCount: spikes.length };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcSlotVolumeRatio:', error);
      throw error;
    }
  }

  /**
   * 5. calcStockMetrics
   * Calculates price_change_pct, holding_range_pct, and stock_status for all tracked
   * and invested stocks, updating stock_metrics.
   */
  async calcStockMetrics() {
    logger.info('[CalcMetricsService] Starting calcStockMetrics calculation...');
    try {
      await db.execute(sql`
        WITH live_metrics AS (
          SELECT l.stock_id, 
                 l.ltp, 
                 l.prev_close, 
                 l.high_price, 
                 l.low_price,
                 m.volume_ratio
          FROM market_data_live l
          LEFT JOIN stock_metrics m ON l.stock_id = m.stock_id
          INNER JOIN stocks s ON l.stock_id = s.id
          WHERE s.is_tracked = true OR s.is_active = true
        ),
        calculated AS (
          SELECT stock_id,
                 CASE 
                   WHEN prev_close > 0 THEN ROUND((((ltp - prev_close) / prev_close) * 100.0), 2)
                   ELSE 0.00
                 END as price_change,
                 CASE 
                   WHEN low_price > 0 THEN ROUND((((high_price - low_price) / low_price) * 100.0), 2)
                   ELSE 0.00
                 END as holding_range,
                 CASE
                   WHEN (prev_close > 0 AND ABS(((ltp - prev_close) / prev_close) * 100.0) >= 2.0)
                        OR (volume_ratio >= 2.0) THEN 'TRENDING'
                   ELSE 'STAGNANT'
                 END as status
          FROM live_metrics
        )
        INSERT INTO stock_metrics (stock_id, price_change_pct, holding_range_pct, stock_status, updated_at)
        SELECT stock_id, price_change, holding_range, status, NOW()
        FROM calculated
        ON CONFLICT (stock_id) DO UPDATE
        SET price_change_pct = EXCLUDED.price_change_pct,
            holding_range_pct = EXCLUDED.holding_range_pct,
            stock_status = EXCLUDED.stock_status,
            updated_at = NOW();
      `);
      logger.info('[CalcMetricsService] Completed calcStockMetrics successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcStockMetrics:', error);
      throw error;
    }
  }

  /**
   * 6. calcSectorMetrics
   * Calculates sector_return_pct, breadth_pct, avg_volume_ratio, outperformance_pct,
   * and sector_status for all sectors — ranks sectors and updates sector_metrics.
   */
  async calcSectorMetrics() {
    logger.info('[CalcMetricsService] Starting calcSectorMetrics calculation...');
    try {
      // 1. Fetch Nifty 50 return to compute outperformance
      const niftyStock = await db.select({ id: stocks.id })
        .from(stocks)
        .where(sql`LOWER(${stocks.symbol}) IN ('nifty 50', 'nifty_50')`)
        .limit(1);

      let niftyReturn = 0.0;
      if (niftyStock.length > 0) {
        const niftyMetric = await db.select({ priceChangePct: stockMetrics.priceChangePct })
          .from(stockMetrics)
          .where(eq(stockMetrics.stockId, niftyStock[0].id))
          .limit(1);
        if (niftyMetric.length > 0) {
          niftyReturn = parseFloat(niftyMetric[0].priceChangePct) || 0.0;
        }
      }

      // 2. Perform sector aggregates and upsert
      await db.execute(sql`
        WITH sector_stock_stats AS (
          SELECT s.sector_id,
                 AVG(m.price_change_pct) as avg_return,
                 AVG(m.volume_ratio) as avg_vol_ratio,
                 COUNT(s.id) as total_stocks,
                 COUNT(s.id) FILTER (WHERE m.price_change_pct > 0) as advancing_stocks
          FROM stocks s
          INNER JOIN stock_metrics m ON s.id = m.stock_id
          WHERE s.sector_id IS NOT NULL AND s.is_active = true
          GROUP BY s.sector_id
        ),
        calculated_sector_metrics AS (
          SELECT sector_id,
                 ROUND(avg_return, 2) as sector_return,
                 ROUND((advancing_stocks::numeric / total_stocks::numeric) * 100.0, 2) as breadth,
                 ROUND(avg_vol_ratio, 4) as avg_volume,
                 ROUND(avg_return - ${niftyReturn}, 2) as outperformance,
                 CASE 
                   WHEN avg_return >= 1.0 THEN 'STRONG'
                   WHEN avg_return <= -1.0 THEN 'WEAK'
                   ELSE 'NEUTRAL'
                 END as status
          FROM sector_stock_stats
        ),
        ranked AS (
          SELECT sector_id, sector_return, breadth, avg_volume, outperformance, status,
                 ROW_NUMBER() OVER (ORDER BY sector_return DESC) as rank_val
          FROM calculated_sector_metrics
        )
        INSERT INTO sector_metrics (sector_id, sector_return_pct, breadth_pct, avg_volume_ratio, outperformance_pct, sector_status, rank, updated_at)
        SELECT sector_id, sector_return, breadth, avg_volume, outperformance, status, rank_val, NOW()
        FROM ranked
        ON CONFLICT (sector_id) DO UPDATE
        SET sector_return_pct = EXCLUDED.sector_return_pct,
            breadth_pct = EXCLUDED.breadth_pct,
            avg_volume_ratio = EXCLUDED.avg_volume_ratio,
            outperformance_pct = EXCLUDED.outperformance_pct,
            sector_status = EXCLUDED.sector_status,
            rank = EXCLUDED.rank,
            updated_at = NOW();
      `);

      // 3. Query the ranked sector list and emit updates
      const updatedSectors = await db.select({
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

      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      eventBus.emit(INTERNAL_EVENTS.SECTOR_METRICS_UPDATED, {
        sectors: updatedSectors,
        timestamp: new Date()
      });

      logger.info('[CalcMetricsService] Completed calcSectorMetrics successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcSectorMetrics:', error);
      throw error;
    }
  }

  /**
   * 7. calcMarketStatus
   * Reads Nifty change_pct from stock_metrics and applies threshold rules
   * to set market_status = STRONG / NEUTRAL / WEAK in market_metrics.
   */
  async calcMarketStatus() {
    logger.info('[CalcMetricsService] Starting calcMarketStatus calculation...');
    try {
      // Find Nifty 50 change
      const niftyStock = await db.select({ id: stocks.id })
        .from(stocks)
        .where(sql`LOWER(${stocks.symbol}) IN ('nifty 50', 'nifty_50')`)
        .limit(1);

      let changePct = 0.0;
      if (niftyStock.length > 0) {
        const niftyMetric = await db.select({ priceChangePct: stockMetrics.priceChangePct })
          .from(stockMetrics)
          .where(eq(stockMetrics.stockId, niftyStock[0].id))
          .limit(1);
        if (niftyMetric.length > 0) {
          changePct = parseFloat(niftyMetric[0].priceChangePct) || 0.0;
        }
      }

      let marketStatus = 'NEUTRAL';
      if (changePct >= 1.0) {
        marketStatus = 'STRONG';
      } else if (changePct <= -1.0) {
        marketStatus = 'WEAK';
      }

      // Upsert global status row in market_metrics
      await db.insert(marketMetrics)
        .values({
          marketStatus,
          isTradingAllowed: marketStatus !== 'WEAK',
          remarks: `Calculated from Nifty 50 change percentage: ${changePct}%`,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: marketMetrics.id, // Or update the first row
          set: {
            marketStatus,
            isTradingAllowed: marketStatus !== 'WEAK',
            remarks: `Calculated from Nifty 50 change percentage: ${changePct}%`,
            updatedAt: new Date()
          }
        });

      // Emit market status update on EventBus
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

      eventBus.emit(INTERNAL_EVENTS.MARKET_STATUS_UPDATED, {
        status: marketStatus,
        isTradingAllowed: marketStatus !== 'WEAK',
        remarks: `Nifty 50 Change: ${changePct}%`,
        timestamp: new Date()
      });

      logger.info({ marketStatus }, '[CalcMetricsService] Completed calcMarketStatus successfully');
      return { success: true, marketStatus };
    } catch (error) {
      logger.error('❌ [CalcMetricsService] Error in calcMarketStatus:', error);
      throw error;
    }
  }
}

export default new CalcMetricsService();
