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
  watchlists
} from '../../db/schema/index.js';
import stateMachineService from '../services/stateMachineService.js';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import kiteTickerService from '../../modules/websocket/services/KiteTickerService.js';
import { eq } from 'drizzle-orm';

// Mock Kite REST
kiteService.getOrderInfo = async (userId, orderId) => {
  logger.info({ userId, orderId }, '🛡️ [MOCK KITE REST] getOrderInfo invoked');
  return { status: 'COMPLETE', filled_quantity: 100 };
};

// Mock Ticker WebSocket connect
let tickerConnectedUser = null;
kiteTickerService.connect = async (userId) => {
  logger.info({ userId }, '🛡️ [MOCK TICKER] connect client socket invoked');
  tickerConnectedUser = userId;
  return {};
};

const testStateMachine = async () => {
  logger.info('🧪 Starting State Machine Worker Integration Tests...');

  try {
    // 1. Clean up database
    logger.info('🧹 Cleaning up database tables...');
    await db.delete(positions);
    await db.delete(tradeLogs);
    await db.delete(tradeStateHistory);
    await db.delete(tradeOrders);
    await db.delete(trades);
    await db.delete(watchlistItems);
    await db.delete(watchlists);
    await db.delete(stocks);
    await db.delete(brokerCredentials);
    await db.delete(brokers);
    await db.delete(strategies);
    await db.delete(users);

    // 2. Seed test environment data
    logger.info('🌱 Seeding database with test operator, strategy, stock...');
    const [testUser] = await db.insert(users).values({
      fullName: 'State Machine Manager',
      email: 'statemachine@test.com',
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

    const [stockInfy] = await db.insert(stocks).values({
      symbol: 'INFY',
      name: 'Infosys Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      lastPrice: '1400.00',
      isTracked: true
    }).returning();

    const [cred] = await db.insert(brokerCredentials).values({
      userId: testUser.id,
      brokerId: brokerZerodha.id,
      apiKey: 'mockkey',
      apiSecretEncrypted: 'mocksecret_encrypted',
      isActive: true
    }).returning();

    // Create a NEW trade
    const [testTrade] = await db.insert(trades).values({
      userId: testUser.id,
      strategyId: strat.id,
      stockId: stockInfy.id,
      brokerConnectionId: cred.id,
      tradeType: 'BUY',
      productType: 'MIS',
      quantity: 100,
      entryPrice: '1400.00',
      status: 'NEW'
    }).returning();

    logger.info('✅ Seeded successfully.');
    logger.info('----------------------------------------------------');

    // 3. Test processTransition
    logger.info('👉 Run 1: processTransition (Valid transition: NEW -> ORDER_PLACED)');
    const transitionRes1 = await stateMachineService.processTransition({
      tradeId: testTrade.id,
      toState: 'ORDER_PLACED',
      reason: 'Buy order has been placed on Kite broker API.',
      triggeredBy: 'SYSTEM'
    });
    logger.info(`Transition 1 Result: from ${transitionRes1.fromState} to ${transitionRes1.toState}`);

    // Verify database status
    const updatedTrade = await db.select().from(trades).where(eq(trades.id, testTrade.id));
    logger.info(`Trade Status: ${updatedTrade[0]?.status} (Expected: ORDER_PLACED)`);

    logger.info('👉 Run 2: processTransition (Invalid transition: ORDER_PLACED -> EXITED)');
    try {
      await stateMachineService.processTransition({
        tradeId: testTrade.id,
        toState: 'EXITED',
        reason: 'Illegal transition check'
      });
      logger.error('❌ Failed: Expected transition to throw validation error but it succeeded.');
      process.exit(1);
    } catch (err) {
      logger.info(`✅ Expected Error Received: ${err.message}`);
    }

    // 4. Test detectStuckOrders
    logger.info('👉 Run 3: detectStuckOrders (Detecting and resolving stale order)');
    // Insert order placed 10 minutes ago
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const [staleOrder] = await db.insert(tradeOrders).values({
      tradeId: testTrade.id,
      brokerOrderId: 'STUCK-BROKER-ORDER-123',
      orderType: 'MARKET',
      transactionType: 'BUY',
      quantity: 100,
      status: 'PENDING',
      createdAt: tenMinutesAgo
    }).returning();

    const stuckRes = await stateMachineService.detectStuckOrders();
    logger.info(`Stuck orders resolved count: ${stuckRes.resolvedCount} (Expected: 1)`);

    const updatedOrder = await db.select().from(tradeOrders).where(eq(tradeOrders.id, staleOrder.id));
    logger.info(`Stuck Order local Status: ${updatedOrder[0]?.status} (Expected: COMPLETE)`);

    // 5. Test runCrashRecovery
    logger.info('👉 Run 4: runCrashRecovery (Re-establishing connections on boot)');
    // Create an open position to trigger user reconnect
    await db.insert(positions).values({
      userId: testUser.id,
      brokerConnectionId: cred.id,
      stockId: stockInfy.id,
      productType: 'MIS',
      quantity: 100,
      averagePrice: '1400.00',
      status: 'OPEN',
      openedAt: new Date()
    });

    tickerConnectedUser = null;
    const recoveryRes = await stateMachineService.runCrashRecovery();
    logger.info(`Ticker reconnect count: ${recoveryRes.tickerReconnects} (Expected: 1)`);
    logger.info(`Ticker connected userId: ${tickerConnectedUser} (Expected: ${testUser.id})`);

    logger.info('----------------------------------------------------');
    logger.info('🎉 All State Machine Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error.message }, '❌ State Machine integration tests failed:');
    process.exit(1);
  }
};

testStateMachine();
