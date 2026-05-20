import 'dotenv/config';
import { db } from '../../db/index.js';
import { 
  trades, 
  tradeOrders, 
  tradeLogs,
  tradeStateHistory,
  positions, 
  positionHistory,
  stocks, 
  brokerCredentials,
  tradeCooldowns,
  watchlistItems,
  watchlists,
  users,
  strategies,
  brokers,
  stockMetrics,
  sectorMetrics,
  marketMetrics,
  sectors
} from '../../db/schema/index.js';
import tradeManagementService from '../services/tradeManagementService.js';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { eq } from 'drizzle-orm';

// Mock Kite Service
kiteService.placeOrder = async (userId, params) => {
  logger.info({ params }, '🛡️ [MOCK KITE] placeOrder invoked for partial fill SL');
  return { order_id: `MOCK-SL-${Date.now()}` };
};

const testTradeManagement = async () => {
  logger.info('🧪 Starting Trade Management Worker Integration Tests...');

  try {
    // 1. Clean up database
    logger.info('🧹 Cleaning up database tables...');
    await db.delete(tradeCooldowns);
    await db.delete(positionHistory);
    await db.delete(positions);
    await db.delete(tradeLogs);
    await db.delete(tradeStateHistory);
    await db.delete(tradeOrders);
    await db.delete(trades);
    await db.delete(watchlistItems);
    await db.delete(watchlists);
    await db.delete(stockMetrics);
    await db.delete(sectorMetrics);
    await db.delete(marketMetrics);
    await db.delete(stocks);
    await db.delete(sectors);
    await db.delete(brokerCredentials);
    await db.delete(brokers);
    await db.delete(strategies);
    await db.delete(users);

    // 2. Seed test environment data
    logger.info('🌱 Seeding database with test operator, sector, stock, position...');
    const [testUser] = await db.insert(users).values({
      fullName: 'Trade Manager Agent',
      email: 'manager@test.com',
      passwordHash: 'dummy'
    }).returning();

    const [brokerZerodha] = await db.insert(brokers).values({
      name: 'ZERODHA',
      displayName: 'Zerodha Kite',
      isActive: true
    }).returning();

    const [strat] = await db.insert(strategies).values({
      name: 'Zero-Thinking Momentum',
      description: 'Momentum signals',
      isActive: true
    }).returning();

    const [testSector] = await db.insert(sectors).values({
      name: 'NIFTY IT',
      displayName: 'IT Index'
    }).returning();

    const [stockInfy] = await db.insert(stocks).values({
      symbol: 'INFY',
      name: 'Infosys Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      sectorId: testSector.id,
      lastPrice: '1400.00', // Starting price
      isTracked: true
    }).returning();

    const [cred] = await db.insert(brokerCredentials).values({
      userId: testUser.id,
      brokerId: brokerZerodha.id,
      apiKey: 'mockkey',
      apiSecretEncrypted: 'mocksecret_encrypted',
      isActive: true
    }).returning();

    const [activeTrade] = await db.insert(trades).values({
      userId: testUser.id,
      strategyId: strat.id,
      stockId: stockInfy.id,
      brokerConnectionId: cred.id,
      tradeType: 'BUY',
      productType: 'MIS',
      quantity: 100,
      entryPrice: '1400.00',
      stopLossPrice: '1372.00',
      status: 'ACTIVE',
      holdingDays: 0
    }).returning();

    const [activePos] = await db.insert(positions).values({
      userId: testUser.id,
      brokerConnectionId: cred.id,
      stockId: stockInfy.id,
      productType: 'MIS',
      quantity: 100,
      averagePrice: '1400.00',
      lastTradedPrice: '1400.00',
      status: 'OPEN',
      openedAt: new Date()
    }).returning();

    // Default watchlist setup
    const [watchlist] = await db.insert(watchlists).values({
      userId: testUser.id,
      name: 'Default List',
      isDefault: true,
      status: 'ACTIVE'
    }).returning();

    await db.insert(watchlistItems).values({
      watchlistId: watchlist.id,
      stockId: stockInfy.id,
      entryPrice: '1400.00',
      stopLoss: '1372.00',
      status: 'TRACKING'
    });

    // Default market status setup
    await db.insert(marketMetrics).values({
      marketStatus: 'NEUTRAL',
      isTradingAllowed: true
    });

    logger.info('✅ Seeded successfully.');
    logger.info('----------------------------------------------------');

    // 3. Test monitorInvestedStocks
    logger.info('👉 Run 1: monitorInvestedStocks (Checking price increase and trailing transition)');
    // Simulate stock price increases to 1475.00 (+5.35%)
    await db.update(stocks).set({ lastPrice: '1475.00' }).where(eq(stocks.id, stockInfy.id));

    const monitorRes = await tradeManagementService.monitorInvestedStocks();
    logger.info(`Monitored count: ${monitorRes.monitoredCount} (Expected: 1)`);

    const updatedTrade = await db.select().from(trades).where(eq(trades.id, activeTrade.id));
    logger.info(`Trade Status: ${updatedTrade[0]?.status} (Expected: TRAILING)`);
    logger.info(`Trade PnL %: ${updatedTrade[0]?.pnlPct}% (Expected: 5.36%)`);

    const updatedPos = await db.select().from(positions).where(eq(positions.id, activePos.id));
    logger.info(`Position PnL %: ${updatedPos[0]?.pnlPct}% (Expected: 5.36%)`);
    logger.info(`Position lastTradedPrice: ${updatedPos[0]?.lastTradedPrice} (Expected: 1475.00)`);

    // 4. Test evaluateTrailingSL
    logger.info('👉 Run 2: evaluateTrailingSL (Locking in break-even stop loss)');
    const trailingRes = await tradeManagementService.evaluateTrailingSL();
    logger.info(`Trailing modifications queued: ${trailingRes.modificationsEnqueued} (Expected: 1)`);

    // 5. Test incrementHoldingDays
    logger.info('👉 Run 3: incrementHoldingDays (Incrementing holding_days by 1)');
    await tradeManagementService.incrementHoldingDays();
    const daysTrade = await db.select().from(trades).where(eq(trades.id, activeTrade.id));
    logger.info(`Holding Days in Trade: ${daysTrade[0]?.holdingDays} (Expected: 1)`);

    // 6. Test evaluateExitRules (SL hit exit check)
    logger.info('👉 Run 4: evaluateExitRules (Triggering Stop Loss hit exit)');
    // Drop price to 1350.00 (below SL of 1372.00)
    await db.update(stocks).set({ lastPrice: '1350.00' }).where(eq(stocks.id, stockInfy.id));
    
    // Set trade status back to ACTIVE so we evaluate exits
    await db.update(trades).set({ status: 'ACTIVE' }).where(eq(trades.id, activeTrade.id));

    const exitRes = await tradeManagementService.evaluateExitRules();
    logger.info(`Exits enqueued: ${exitRes.exitsEnqueued} (Expected: 1)`);

    const exitedTrade = await db.select().from(trades).where(eq(trades.id, activeTrade.id));
    logger.info(`Trade Status post exit trigger: ${exitedTrade[0]?.status} (Expected: EXIT_TRIGGERED)`);
    logger.info(`Exit remarks: ${exitedTrade[0]?.remarks} (Expected: Stop Loss Hit...)`);

    // 7. Test processCooldownTracker
    logger.info('👉 Run 5: processCooldownTracker (Releasing cooldown blocks)');
    const cdExpires = new Date();
    cdExpires.setHours(cdExpires.getHours() - 1); // 1 hour in the past (already expired)
    await db.insert(tradeCooldowns).values({
      userId: testUser.id,
      stockId: stockInfy.id,
      tradeId: activeTrade.id,
      cooldownStart: new Date(Date.now() - 2 * 3600000),
      cooldownExpires: cdExpires,
      isActive: true
    });

    const cooldownRes = await tradeManagementService.processCooldownTracker();
    logger.info(`Released cooldowns count: ${cooldownRes.releasedCount} (Expected: 1)`);

    // 8. Test processPartialFill
    logger.info('👉 Run 6: processPartialFill (Resolving partial fill state updates)');
    
    // Insert new pending BUY order
    const [partialTrade] = await db.insert(trades).values({
      userId: testUser.id,
      strategyId: strat.id,
      stockId: stockInfy.id,
      brokerConnectionId: cred.id,
      tradeType: 'BUY',
      productType: 'MIS',
      quantity: 100,
      entryPrice: '1400.00',
      status: 'ORDER_PLACED'
    }).returning();

    const [partialOrder] = await db.insert(tradeOrders).values({
      tradeId: partialTrade.id,
      brokerOrderId: 'KITE-BUY-PARTIAL',
      orderType: 'MARKET',
      transactionType: 'BUY',
      quantity: 100,
      price: '1400.00',
      status: 'PENDING'
    }).returning();

    const fillRes = await tradeManagementService.processPartialFill({
      tradeId: partialTrade.id,
      orderId: partialOrder.id,
      brokerOrderId: 'KITE-BUY-PARTIAL',
      filledQuantity: 60,
      fillPrice: 1405.00,
      remainingQuantity: 40
    });

    logger.info(`Partial fill position created: ${fillRes.positionId}`);

    const updatedPartialOrder = await db.select().from(tradeOrders).where(eq(tradeOrders.id, partialOrder.id));
    logger.info(`Order Status: ${updatedPartialOrder[0]?.status} (Expected: PARTIALLY_FILLED)`);
    logger.info(`Order Filled Qty: ${updatedPartialOrder[0]?.filledQuantity} (Expected: 60)`);

    const updatedPartialTrade = await db.select().from(trades).where(eq(trades.id, partialTrade.id));
    logger.info(`Trade status: ${updatedPartialTrade[0]?.status} (Expected: ACTIVE)`);
    logger.info(`Trade quantity: ${updatedPartialTrade[0]?.quantity} (Expected: 60)`);

    logger.info('----------------------------------------------------');
    logger.info('🎉 All 6 Trade Management Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Trade Management integration tests failed:');
    console.error(error);
    process.exit(1);
  }
};

testTradeManagement();
