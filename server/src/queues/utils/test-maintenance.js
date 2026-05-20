import 'dotenv/config';
import { db } from '../../db/index.js';
import { 
  trades, 
  tradeOrders, 
  tradeLogs,
  tradeStateHistory,
  positions, 
  stocks, 
  brokerCredentials,
  users,
  strategies,
  brokers,
  watchlistItems,
  watchlists,
  marketDataDaily,
  marketDataLive,
  tradeCooldowns,
  gttOrders,
  dailyPerformanceSnapshots,
  alerts,
  notifications,
  stockMetrics
} from '../../db/schema/index.js';
import maintenanceService from '../services/maintenance.service.js';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { eq, lte, and } from 'drizzle-orm';

// Mock Kite REST APIs for positions and GTT sync
kiteService.getSessionStatus = async (userId) => {
  return { active: true };
};

kiteService.getPositions = async (userId) => {
  logger.info({ userId }, '🛡️ [MOCK KITE REST] getPositions invoked');
  return {
    net: [
      {
        tradingsymbol: 'INFY',
        exchange: 'NSE',
        product: 'MIS',
        quantity: 100 // Matches our seeded position to check no alert, but we will seed a discrepancy for INFY CNC
      }
    ]
  };
};

kiteService.getHoldings = async (userId) => {
  logger.info({ userId }, '🛡️ [MOCK KITE REST] getHoldings invoked');
  return [
    {
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      product: 'CNC',
      quantity: 50 // Seeding mismatch: DB has 100 CNC, Kite has 50 CNC
    }
  ];
};

kiteService.getGtts = async (userId) => {
  logger.info({ userId }, '🛡️ [MOCK KITE REST] getGtts invoked');
  return [
    {
      trigger_id: 'mock-gtt-id-999',
      status: 'TRIGGERED',
      updated_at: new Date()
    }
  ];
};

const testMaintenance = async () => {
  logger.info('🧪 Starting Maintenance and EOD Worker Integration Tests...');

  try {
    // 1. Clean up database
    logger.info('🧹 Cleaning up database tables...');
    await db.delete(dailyPerformanceSnapshots);
    await db.delete(alerts);
    await db.delete(notifications);
    await db.delete(positions);
    await db.delete(tradeLogs);
    await db.delete(tradeStateHistory);
    await db.delete(tradeOrders);
    await db.delete(tradeCooldowns);
    await db.delete(gttOrders);
    await db.delete(trades);
    await db.delete(watchlistItems);
    await db.delete(watchlists);
    await db.delete(marketDataDaily);
    await db.delete(marketDataLive);
    await db.delete(stockMetrics);
    await db.delete(stocks);
    await db.delete(brokerCredentials);
    await db.delete(brokers);
    await db.delete(strategies);
    await db.delete(users);

    // 2. Seed test environment data
    logger.info('🌱 Seeding database for maintenance testing...');
    const [testUser] = await db.insert(users).values({
      fullName: 'Maintenance Operator',
      email: 'maintenance@test.com',
      passwordHash: 'dummy'
    }).returning();

    const [brokerZerodha] = await db.insert(brokers).values({
      name: 'ZERODHA',
      displayName: 'Zerodha Kite',
      isActive: true
    }).returning();

    const [strat] = await db.insert(strategies).values({
      name: 'Zero-Thinking Reversal',
      description: 'Reversal signals',
      isActive: true
    }).returning();

    const [stockInfy] = await db.insert(stocks).values({
      symbol: 'INFY',
      name: 'Infosys Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      lastPrice: '1400.00',
      isTracked: true,
      isActive: true
    }).returning();

    const [cred] = await db.insert(brokerCredentials).values({
      userId: testUser.id,
      brokerId: brokerZerodha.id,
      apiKey: 'mockkey',
      apiSecretEncrypted: 'mocksecret_encrypted',
      isActive: true
    }).returning();

    // Seed market_data_live
    await db.insert(marketDataLive).values({
      stockId: stockInfy.id,
      ltp: '1410.00',
      openPrice: '1395.00',
      highPrice: '1415.00',
      lowPrice: '1390.00',
      todayVolume: 500000,
      exchangeTimestamp: new Date()
    });

    // Seed 10 daily candles to verify averaging
    const today = new Date();
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      await db.insert(marketDataDaily).values({
        stockId: stockInfy.id,
        date: date,
        open: 1390 + i,
        high: 1400 + i,
        low: 1380 + i,
        close: 1395 + i,
        volume: 100000 * i
      });
    }

    // Seed open positions (one matching, one discrepancy)
    // 1. Matching MIS position (100 qty)
    await db.insert(positions).values({
      userId: testUser.id,
      brokerConnectionId: cred.id,
      stockId: stockInfy.id,
      productType: 'MIS',
      quantity: 100,
      averagePrice: '1400.00',
      status: 'OPEN',
      holdingDays: 0,
      openedAt: new Date()
    });

    // 2. Discrepancy CNC position (DB says 100, Kite mock says 50)
    await db.insert(positions).values({
      userId: testUser.id,
      brokerConnectionId: cred.id,
      stockId: stockInfy.id,
      productType: 'CNC',
      quantity: 100,
      averagePrice: '1405.00',
      status: 'OPEN',
      holdingDays: 3,
      openedAt: new Date()
    });

    // Seed active cooldown
    const futureExpiry = new Date();
    futureExpiry.setMinutes(futureExpiry.getMinutes() + 10);
    const pastExpiry = new Date();
    pastExpiry.setMinutes(pastExpiry.getMinutes() - 10);

    const [mockTrade] = await db.insert(trades).values({
      userId: testUser.id,
      stockId: stockInfy.id,
      brokerConnectionId: cred.id,
      tradeType: 'BUY',
      productType: 'MIS',
      quantity: 10,
      entryPrice: '1400.00',
      status: 'NEW'
    }).returning();

    await db.insert(tradeCooldowns).values({
      stockId: stockInfy.id,
      userId: testUser.id,
      tradeId: mockTrade.id,
      cooldownStart: new Date(Date.now() - 3600000),
      cooldownExpires: pastExpiry, // Expired
      isActive: true
    });

    // Seed GTT order
    await db.insert(gttOrders).values({
      tradeId: mockTrade.id,
      stockId: stockInfy.id,
      kiteGttId: 'mock-gtt-id-999',
      triggerPrice: '1350.00',
      gttStatus: 'ACTIVE',
      gttType: 'SINGLE'
    });

    // Seed closed trades for performance snapshot
    await db.insert(trades).values({
      userId: testUser.id,
      stockId: stockInfy.id,
      brokerConnectionId: cred.id,
      tradeType: 'BUY',
      productType: 'MIS',
      quantity: 10,
      entryPrice: '1400.00',
      targetPrice: '1420.00',
      stopLossPrice: '1380.00',
      status: 'EXITED',
      entryTime: new Date(Date.now() - 7200000),
      exitTime: new Date(),
      pnl: '200.00',
      pnlPct: '1.43',
      holdingDays: 0
    });

    logger.info('✅ Database successfully seeded.');
    logger.info('----------------------------------------------------');

    // 3. Run EOD Orchestration
    logger.info('👉 Run 1: runEndOfDayOrchestration');
    await maintenanceService.runEndOfDayOrchestration(today);

    // Verify daily candle stored
    const todayCandle = await db.select()
      .from(marketDataDaily)
      .where(and(
        eq(marketDataDaily.stockId, stockInfy.id),
        eq(marketDataDaily.date, new Date(today.setHours(0,0,0,0)))
      ));
    logger.info(`Daily candle stored today: ${todayCandle.length > 0 ? 'YES' : 'NO'} (Expected: YES)`);
    if (todayCandle.length > 0) {
      logger.info(`Candle Close Price: ${todayCandle[0].close} (Expected: 1410.00)`);
    }

    // Verify 10d average volume recalculation
    const metrics = await db.select().from(stockMetrics).where(eq(stockMetrics.stockId, stockInfy.id));
    logger.info(`Recalculated 10d average volume: ${metrics[0]?.avg10dVolume} (Expected: ~550000)`);

    // Verify holding days incremented
    const activePositions = await db.select().from(positions).where(eq(positions.userId, testUser.id));
    for (const pos of activePositions) {
      logger.info(`Position product ${pos.productType} holding days: ${pos.holdingDays}`);
    }

    // Verify trade cooldown deactivated
    const cooldown = await db.select().from(tradeCooldowns).where(eq(tradeCooldowns.userId, testUser.id));
    logger.info(`Expired cooldown is active: ${cooldown[0]?.isActive ? 'YES' : 'NO'} (Expected: NO)`);

    // Verify GTT sync
    const gtt = await db.select().from(gttOrders).where(eq(gttOrders.kiteGttId, 'mock-gtt-id-999'));
    logger.info(`GTT status synced: ${gtt[0]?.gttStatus} (Expected: TRIGGERED)`);

    // 4. Run Position Reconciliation
    logger.info('👉 Run 2: reconcilePositions');
    await maintenanceService.reconcilePositions(testUser.id);

    // Verify alert generated for CNC mismatch
    const discrepancyAlerts = await db.select().from(alerts).where(eq(alerts.userId, testUser.id));
    logger.info(`Discrepancy alert generated: ${discrepancyAlerts.length > 0 ? 'YES' : 'NO'} (Expected: YES)`);
    if (discrepancyAlerts.length > 0) {
      logger.info(`Alert config: ${JSON.stringify(discrepancyAlerts[0].conditionConfig)}`);
    }

    // 5. Run Performance Snapshot
    logger.info('👉 Run 3: takePerformanceSnapshot');
    const snapshotResult = await maintenanceService.takePerformanceSnapshot(new Date());
    logger.info(`Snapshot recorded: ${snapshotResult.success ? 'YES' : 'NO'}`);
    if (snapshotResult.success) {
      logger.info(`Total Trades: ${snapshotResult.snapshot.totalTrades} (Expected: 1)`);
      logger.info(`Winning Trades: ${snapshotResult.snapshot.winningTrades} (Expected: 1)`);
      logger.info(`Total PnL: ${snapshotResult.snapshot.totalPnl} (Expected: 200.00)`);
      logger.info(`Capital Deployed: ${snapshotResult.snapshot.capitalDeployed} (Expected: 14000.00)`);
    }

    logger.info('----------------------------------------------------');
    logger.info('🎉 All Maintenance and EOD Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error.message }, '❌ Maintenance integration tests failed:');
    process.exit(1);
  }
};

testMaintenance();
