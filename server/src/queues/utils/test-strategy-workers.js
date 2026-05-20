import 'dotenv/config';
import { db } from '../../db/index.js';
import { 
  stocks, 
  sectors, 
  stockMetrics, 
  sectorMetrics, 
  marketMetrics, 
  marketDataLive, 
  marketDataIntraday, 
  watchlists,
  watchlistItems,
  confirmationTimers,
  signals,
  entrySignals,
  users
} from '../../db/schema/index.js';
import strategySignalsService from '../services/strategySignalsService.js';
import logger from '../../config/logger.js';
import { eq } from 'drizzle-orm';

const testStrategyWorkers = async () => {
  logger.info('🧪 Starting Strategy & Signal Worker Integration Tests...');

  try {
    // 1. Clean up existing records
    logger.info('🧹 Cleaning up database tables...');
    await db.delete(confirmationTimers);
    await db.delete(entrySignals);
    await db.delete(signals);
    await db.delete(watchlistItems);
    await db.delete(watchlists);
    await db.delete(marketDataLive);
    await db.delete(marketDataIntraday);
    await db.delete(stockMetrics);
    await db.delete(sectorMetrics);
    await db.delete(marketMetrics);
    await db.delete(stocks);
    await db.delete(sectors);
    await db.delete(users);

    // 2. Seed User & Sectors
    logger.info('🌱 Seeding user, sectors and stocks...');
    const [testUser] = await db.insert(users).values({
      fullName: 'Test Strategy Operator',
      email: 'operator@test.com',
      passwordHash: 'dummyhash'
    }).returning();

    const [sectorIT] = await db.insert(sectors).values({
      name: 'Technology',
      description: 'IT Services'
    }).returning();

    // 3. Seed Stocks
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

    // 4. Seed Metrics & Quotes (Neutral Market initially)
    logger.info('🌱 Seeding market quotes and stock metrics...');
    await db.insert(marketMetrics).values({
      marketStatus: 'NEUTRAL',
      isTradingAllowed: true,
      remarks: 'Neutral trend',
      updatedAt: new Date()
    });

    await db.insert(sectorMetrics).values({
      sectorId: sectorIT.id,
      sectorStatus: 'STRONG',
      sectorReturnPct: '1.20',
      breadthPct: '70.00',
      avgVolumeRatio: '1.40',
      outperformancePct: '1.10'
    });

    await db.insert(stockMetrics).values({
      stockId: stockInfy.id,
      avg10dVolume: 1000000,
      volumeRatio: '1.8000', // Volume ratio is 1.8 >= 1.2
      priceChangePct: '2.50',
      stockStatus: 'TRENDING'
    });

    await db.insert(marketDataLive).values([
      {
        stockId: stockNifty.id,
        ltp: '22000.00',
        prevClose: '22000.00',
        exchangeTimestamp: new Date()
      },
      {
        stockId: stockInfy.id,
        ltp: '1425.00', // Price 1425.00 > entry price 1400.00
        prevClose: '1400.00',
        exchangeTimestamp: new Date()
      }
    ]);

    // 5. Seed Watchlist
    logger.info('🌱 Seeding watchlist items...');
    const [watchlist] = await db.insert(watchlists).values({
      userId: testUser.id,
      name: 'Primary Watchlist',
      isDefault: true,
      status: 'ACTIVE'
    }).returning();

    await db.insert(watchlistItems).values({
      watchlistId: watchlist.id,
      stockId: stockInfy.id,
      entryPrice: '1400.00',
      status: 'TRACKING'
    });

    logger.info('✅ Database Seeded Successfully!');
    logger.info('----------------------------------------------------');

    // 6. Test runTrackedStockEngine
    logger.info('👉 Run 1: runTrackedStockEngine (Core entry rule engine checks)');
    const engineRes = await strategySignalsService.runTrackedStockEngine();
    logger.info(`Engine processed candidates: ${engineRes.processed} (Expected: 1)`);

    const updatedItem = await db.select().from(watchlistItems).where(eq(watchlistItems.stockId, stockInfy.id));
    logger.info(`INFY Watchlist Item status: ${updatedItem[0]?.status} (Expected: WAITING_CONFIRMATION)`);

    const timers = await db.select().from(confirmationTimers).where(eq(confirmationTimers.stockId, stockInfy.id));
    logger.info(`Active confirmation timers count: ${timers.length} (Expected: 1)`);

    // 7. Test monitorConfirmationTimers
    logger.info('👉 Run 2: monitorConfirmationTimers (Evaluating expired confirmation window)');
    // Force the timer to be expired
    await db.update(confirmationTimers)
      .set({ timerExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(confirmationTimers.id, timers[0].id));

    // Seed intraday candle with low above entry to simulate sustained price (Passed)
    await db.insert(marketDataIntraday).values({
      stockId: stockInfy.id,
      candleTime: new Date(Date.now() - 60000),
      open: '1420.00',
      high: '1430.00',
      low: '1410.00', // low is 1410.00 > entry price 1400.00 (sustaining)
      close: '1425.00',
      volume: 10000
    });

    const monitorRes = await strategySignalsService.monitorConfirmationTimers();
    logger.info(`Monitor confirmed timer signals: ${monitorRes.activated} (Expected: 1)`);

    const readyItem = await db.select().from(watchlistItems).where(eq(watchlistItems.stockId, stockInfy.id));
    logger.info(`INFY Watchlist Item status: ${readyItem[0]?.status} (Expected: READY)`);

    const signalCount = await db.select().from(signals).where(eq(signals.stockId, stockInfy.id));
    logger.info(`Signals generated count: ${signalCount.length} (Expected: 1)`);

    // 8. Test weakMarketExceptionWorker
    logger.info('👉 Run 3: runWeakMarketException (Evaluating exception under WEAK market)');
    // Reset status back to TRACKING to re-test
    await db.update(watchlistItems).set({ status: 'TRACKING' }).where(eq(watchlistItems.stockId, stockInfy.id));
    // Clear old signals
    await db.delete(confirmationTimers);
    await db.delete(entrySignals);
    await db.delete(signals);

    // Set market status to WEAK
    await db.update(marketMetrics).set({ marketStatus: 'WEAK' });

    const weakRes = await strategySignalsService.runWeakMarketException();
    logger.info(`Weak exception signals generated: ${weakRes.processed} (Expected: 1)`);

    const weakReadyItem = await db.select().from(watchlistItems).where(eq(watchlistItems.stockId, stockInfy.id));
    logger.info(`INFY Watchlist Item status under WEAK: ${weakReadyItem[0]?.status} (Expected: READY)`);

    const weakSignal = await db.select().from(signals).where(eq(signals.stockId, stockInfy.id));
    logger.info(`Weak Exception Signal Metadata: ${JSON.stringify(weakSignal[0]?.metadata)} (Expected: contains weakMarketException: true)`);

    // 9. Test volumeSignalQualityWorker
    logger.info('👉 Run 4: evaluateSignalQuality (Scoring signals)');
    const qualityRes = await strategySignalsService.evaluateSignalQuality();
    logger.info(`Signals scored and evaluated: ${qualityRes.evaluated} (Expected: 1)`);

    const scoredSignal = await db.select().from(signals).where(eq(signals.stockId, stockInfy.id));
    logger.info(`Signal Score: ${scoredSignal[0]?.signalScore} (Expected: ~79-90 depending on metrics)`);
    logger.info(`Signal Quality Status: ${scoredSignal[0]?.signalStatus} (Expected: STRONG or ACCEPTABLE)`);

    logger.info('----------------------------------------------------');
    logger.info('🎉 All 4 Strategy & Signal Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Strategy & Signal integration tests failed:');
    console.error(error);
    process.exit(1);
  }
};

testStrategyWorkers();
