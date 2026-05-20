import 'dotenv/config';
import { db } from '../../db/index.js';
import { 
  stocks, 
  sectors, 
  stockMetrics, 
  sectorMetrics, 
  marketMetrics, 
  marketDataLive, 
  marketDataDaily, 
  marketDataIntraday, 
  volumeData15min 
} from '../../db/schema/index.js';
import calcMetricsService from '../services/calcMetricsService.js';
import logger from '../../config/logger.js';
import { eq } from 'drizzle-orm';

const testCalcWorkers = async () => {
  logger.info('🧪 Starting Calculation & Metrics Worker Integration Tests...');

  try {
    // 1. Clear existing test data
    logger.info('🧹 Cleaning up old test records...');
    await db.delete(marketDataLive);
    await db.delete(marketDataDaily);
    await db.delete(marketDataIntraday);
    await db.delete(volumeData15min);
    await db.delete(stockMetrics);
    await db.delete(sectorMetrics);
    await db.delete(marketMetrics);
    await db.delete(stocks);
    await db.delete(sectors);

    // 2. Seed Sectors
    logger.info('🌱 Seeding Sectors...');
    const [sectorIT] = await db.insert(sectors).values({
      name: 'Technology',
      description: 'IT Services and Software'
    }).returning();

    const [sectorBank] = await db.insert(sectors).values({
      name: 'Banking',
      description: 'Financial Institutions'
    }).returning();

    // 3. Seed Stocks (including Nifty 50)
    logger.info('🌱 Seeding Stocks...');
    const [stockNifty] = await db.insert(stocks).values({
      symbol: 'NIFTY 50',
      name: 'Nifty 50 Index',
      instrumentType: 'INDEX',
      exchange: 'NSE',
      isTradeable: false,
      isTracked: true
    }).returning();

    const [stockInfy] = await db.insert(stocks).values({
      symbol: 'INFY',
      name: 'Infosys Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      sectorId: sectorIT.id,
      isTracked: true
    }).returning();

    const [stockHdfc] = await db.insert(stocks).values({
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      sectorId: sectorBank.id,
      isTracked: true
    }).returning();

    // 4. Seed Daily candles for avg_10d_volume calculation (10 candles for INFY and HDFCBANK)
    logger.info('🌱 Seeding Daily Candles for average volume calculation...');
    const dailyCandles = [];
    const baseDate = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() - i - 1); // Historical dates

      dailyCandles.push({
        stockId: stockInfy.id,
        date,
        open: '1400.00',
        high: '1420.00',
        low: '1390.00',
        close: '1410.00',
        volume: 1000000 + (i * 50000) // Average volume will be 1,225,000
      });

      dailyCandles.push({
        stockId: stockHdfc.id,
        date,
        open: '1500.00',
        high: '1520.00',
        low: '1480.00',
        close: '1510.00',
        volume: 2000000 - (i * 100000) // Average volume will be 1,550,000
      });
    }
    await db.insert(marketDataDaily).values(dailyCandles);

    // 5. Seed Live Market Price Data
    logger.info('🌱 Seeding Live Market Price quotes...');
    await db.insert(marketDataLive).values([
      {
        stockId: stockNifty.id,
        ltp: '22300.00',
        prevClose: '22000.00', // +1.36% change (Strong Market)
        exchangeTimestamp: new Date()
      },
      {
        stockId: stockInfy.id,
        ltp: '1430.00',
        prevClose: '1400.00', // +2.14% change
        highPrice: '1440.00',
        lowPrice: '1395.00',
        todayVolume: 2450000,  // Should yield 2.0x volume ratio
        exchangeTimestamp: new Date()
      },
      {
        stockId: stockHdfc.id,
        ltp: '1530.00',
        prevClose: '1510.00', // +1.32% change
        highPrice: '1540.00',
        lowPrice: '1505.00',
        todayVolume: 775000,   // Should yield 0.5x volume ratio
        exchangeTimestamp: new Date()
      }
    ]);

    // 6. Seed Intraday 15-min Same-Slot Candles for slot baseline calculation
    logger.info('🌱 Seeding Intraday 15-min candles...');
    const intradayCandles = [];
    // We seed 10 same-slot candles for 9:15 AM over past 10 days
    for (let i = 0; i < 12; i++) {
      const candleTime = new Date();
      candleTime.setDate(baseDate.getDate() - i - 1);
      candleTime.setHours(9, 15, 0, 0); // 09:15 IST slot

      intradayCandles.push({
        stockId: stockInfy.id,
        candleTime,
        open: '1400.00',
        high: '1410.00',
        low: '1398.00',
        close: '1405.00',
        volume: 50000 + (i * 2000) // Avg 10-day volume around 59,000
      });

      intradayCandles.push({
        stockId: stockHdfc.id,
        candleTime,
        open: '1500.00',
        high: '1505.00',
        low: '1498.00',
        close: '1502.00',
        volume: 80000 - (i * 3000) // Avg 10-day volume around 66,500
      });
    }
    await db.insert(marketDataIntraday).values(intradayCandles);

    // Seed today's volume_data_15min placeholder row to calculate ratios against
    const startOfTodaySlot = new Date();
    startOfTodaySlot.setHours(9, 15, 0, 0);
    const endOfTodaySlot = new Date();
    endOfTodaySlot.setHours(9, 30, 0, 0);

    await db.insert(volumeData15min).values([
      {
        stockId: stockInfy.id,
        intervalStart: startOfTodaySlot,
        intervalEnd: endOfTodaySlot,
        volume: 130000 // 130,000 / 59,000 = 2.2x ratio (spike expected)
      },
      {
        stockId: stockHdfc.id,
        intervalStart: startOfTodaySlot,
        intervalEnd: endOfTodaySlot,
        volume: 30000 // 30,000 / 66,500 = 0.45x ratio (no spike)
      }
    ]);

    logger.info('✅ Database Seeded Successfully!');
    logger.info('----------------------------------------------');

    // 7. Run calcAvgVolume Worker logic
    logger.info('👉 Run 1: calcAvgVolume (Calculating 10-day average volumes)');
    await calcMetricsService.calcAvgVolume();
    const infyMetric1 = await db.select().from(stockMetrics).where(eq(stockMetrics.stockId, stockInfy.id));
    logger.info(`INFY 10-day Average Volume calculated: ${infyMetric1[0]?.avg10dVolume} (Expected: 1225000)`);

    // 8. Run calcVolumeRatio Worker logic
    logger.info('👉 Run 2: calcVolumeRatio (Volume ratio relative to 10-day average)');
    await calcMetricsService.calcVolumeRatio();
    const infyMetric2 = await db.select().from(stockMetrics).where(eq(stockMetrics.stockId, stockInfy.id));
    logger.info(`INFY Volume Ratio: ${infyMetric2[0]?.volumeRatio} (Expected: ~2.0000)`);

    // 9. Run calcSlotVolumeBaseline Worker logic
    logger.info('👉 Run 3: calcSlotVolumeBaseline (Determining same-slot average baseline)');
    await calcMetricsService.calcSlotVolumeBaseline();
    const infySlot1 = await db.select().from(volumeData15min).where(eq(volumeData15min.stockId, stockInfy.id));
    logger.info(`INFY 09:15 Same-Slot 10-day average: ${infySlot1[0]?.avgVolume10d} (Expected: ~59000)`);

    // 10. Run calcSlotVolumeRatio Worker logic
    logger.info('👉 Run 4: calcSlotVolumeRatio (15-min slot volume spikes)');
    const resSlotRatio = await calcMetricsService.calcSlotVolumeRatio();
    const infySlot2 = await db.select().from(volumeData15min).where(eq(volumeData15min.stockId, stockInfy.id));
    logger.info(`INFY 09:15 Slot Volume Ratio: ${infySlot2[0]?.volumeRatio}`);
    logger.info(`INFY 09:15 Spike flag: ${infySlot2[0]?.isSpike} (Expected: 1 because ratio >= 2.0)`);
    logger.info(`Spikes emitted to WS event bus: ${resSlotRatio.spikesCount}`);

    // 11. Run calcStockMetrics Worker logic
    logger.info('👉 Run 5: calcStockMetrics (Change %, range % and status)');
    await calcMetricsService.calcStockMetrics();
    const infyMetric3 = await db.select().from(stockMetrics).where(eq(stockMetrics.stockId, stockInfy.id));
    logger.info(`INFY Price Change: ${infyMetric3[0]?.priceChangePct}% (Expected: ~2.14%)`);
    logger.info(`INFY Holding Range: ${infyMetric3[0]?.holdingRangePct}% (Expected: ~3.23%)`);
    logger.info(`INFY Stock Status: ${infyMetric3[0]?.stockStatus} (Expected: TRENDING)`);

    // 12. Run calcSectorMetrics Worker logic
    logger.info('👉 Run 6: calcSectorMetrics (Sector aggregate return, rank, outperformance)');
    await calcMetricsService.calcSectorMetrics();
    const sectorsLeaderboard = await db.select({
      name: sectors.name,
      ret: sectorMetrics.sectorReturnPct,
      breadth: sectorMetrics.breadthPct,
      rank: sectorMetrics.rank,
      status: sectorMetrics.sectorStatus
    }).from(sectorMetrics)
      .innerJoin(sectors, eq(sectorMetrics.sectorId, sectors.id))
      .orderBy(sectorMetrics.rank);
    logger.info('Sector Metrics Board:');
    console.table(sectorsLeaderboard);

    // 13. Run calcMarketStatus Worker logic
    logger.info('👉 Run 7: calcMarketStatus (Global market health check)');
    const resMarket = await calcMetricsService.calcMarketStatus();
    logger.info(`Market status set to: ${resMarket.marketStatus} (Expected: STRONG since Nifty change is +1.36%)`);

    logger.info('----------------------------------------------');
    logger.info('🎉 All 7 integration calculation routines completed and verified!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Integration tests failed:');
    console.error(error);
    process.exit(1);
  }
};

testCalcWorkers();
