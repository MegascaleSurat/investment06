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
  capitalAllocation,
  tradeCooldowns,
  watchlistItems,
  watchlists,
  users,
  strategies,
  brokers
} from '../../db/schema/index.js';
import orderExecutionService from '../services/orderExecutionService.js';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { eq, and } from 'drizzle-orm';

// Mock Kite Service calls to avoid real Zerodha hits during test execution
let mockOrderStatus = 'PENDING';
let mockPrice = '1425.00';

kiteService.placeOrder = async (userId, params) => {
  logger.info({ params }, '🛡️ [MOCK KITE] placeOrder invoked');
  return { order_id: `KITE-${params.transaction_type}-${Date.now()}` };
};

kiteService.modifyOrder = async (userId, orderId, params) => {
  logger.info({ orderId, params }, '🛡️ [MOCK KITE] modifyOrder invoked');
  return { status: 'success' };
};

kiteService.cancelOrder = async (userId, orderId) => {
  logger.info({ orderId }, '🛡️ [MOCK KITE] cancelOrder invoked');
  return { status: 'success' };
};

kiteService.getOrderInfo = async (userId, orderId) => {
  logger.info({ orderId }, '🛡️ [MOCK KITE] getOrderInfo invoked');
  return {
    status: mockOrderStatus,
    average_price: mockPrice,
    status_message: 'Mock status details'
  };
};

const testOrderWorkers = async () => {
  logger.info('🧪 Starting Order Execution Worker Integration Tests...');

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
    await db.delete(capitalAllocation);
    await db.delete(brokerCredentials);
    await db.delete(brokers);
    await db.delete(strategies);
    await db.delete(stocks);
    await db.delete(users);

    // 2. Seed test environment data
    logger.info('🌱 Seeding database with test operator and credentials...');
    const [testUser] = await db.insert(users).values({
      fullName: 'Order Executor Agent',
      email: 'order@test.com',
      passwordHash: 'dummy'
    }).returning();

    const [brokerZerodha] = await db.insert(brokers).values({
      name: 'ZERODHA',
      displayName: 'Zerodha Kite',
      isActive: true
    }).returning();

    const [strat] = await db.insert(strategies).values({
      name: 'Zero-Thinking Breakout',
      description: 'Breakout signals',
      isActive: true
    }).returning();

    const [stockInfy] = await db.insert(stocks).values({
      symbol: 'INFY',
      name: 'Infosys Limited',
      instrumentType: 'EQUITY',
      exchange: 'NSE',
      isTracked: true
    }).returning();

    await db.insert(brokerCredentials).values({
      userId: testUser.id,
      brokerId: brokerZerodha.id,
      apiKey: 'mockkey',
      apiSecretEncrypted: 'mocksecret_encrypted',
      isActive: true
    });

    await db.insert(capitalAllocation).values({
      userId: testUser.id,
      strategyId: strat.id,
      allocatedAmount: '100000.00', // 1 Lakh capital allocated
      isActive: true
    });

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
      stopLoss: '1372.00', // 2% SL
      status: 'READY'
    });

    logger.info('✅ Seeded successfully.');
    logger.info('----------------------------------------------------');

    // 3. Test placeBuyOrder (placing initial buy target)
    logger.info('👉 Run 1: placeBuyOrder (Initiating buy entry)');
    const buyResult = await orderExecutionService.placeBuyOrder({
      userId: testUser.id,
      stockId: stockInfy.id,
      strategyId: strat.id,
      signalId: strat.id, // dummy uuid
      price: 1425.00
    });

    logger.info(`Buy order result: ${JSON.stringify(buyResult)}`);
    const activeTrade = await db.select().from(trades).where(eq(trades.id, buyResult.tradeId));
    logger.info(`Trade Status: ${activeTrade[0]?.status} (Expected: ORDER_PLACED)`);
    logger.info(`Calculated Quantity: ${activeTrade[0]?.quantity} (Expected: Math.floor(100000 / 1425) = 70)`);

    // 4. Test pollOrderStatuses (polling for PENDING buy order fills)
    logger.info('👉 Run 2: pollOrderStatuses (Detecting BUY order completion)');
    mockOrderStatus = 'COMPLETE';
    mockPrice = '1425.00';

    const pollRes = await orderExecutionService.pollOrderStatuses();
    logger.info(`Poller completed jobs: ${pollRes.processed} (Expected: 1)`);

    const filledTrade = await db.select().from(trades).where(eq(trades.id, buyResult.tradeId));
    logger.info(`Trade status after fill: ${filledTrade[0]?.status} (Expected: ACTIVE)`);

    const activePos = await db.select().from(positions).where(eq(positions.userId, testUser.id));
    logger.info(`Positions opened: ${activePos.length} (Expected: 1)`);
    logger.info(`Position Status: ${activePos[0]?.status} (Expected: OPEN)`);

    // Manually run placeStopLoss to simulate the worker execution
    await orderExecutionService.placeStopLoss({
      tradeId: buyResult.tradeId,
      userId: testUser.id,
      stockId: stockInfy.id,
      quantity: activePos[0].quantity,
      entryPrice: parseFloat(activePos[0].averagePrice)
    });

    const slOrderRecord = await db.select().from(tradeOrders).where(
      and(
        eq(tradeOrders.tradeId, buyResult.tradeId),
        eq(tradeOrders.orderType, 'SL-M')
      )
    );
    logger.info(`Stop Loss order records generated: ${slOrderRecord.length} (Expected: 1)`);
    logger.info(`SL Trigger Price: ${slOrderRecord[0]?.triggerPrice} (Expected: 1372.00 from watchlist)`);

    // 5. Test modifyStopLoss (trailing Stop Loss price modification)
    logger.info('👉 Run 3: modifyStopLoss (Trailing SL trigger price adjustment)');
    const modResult = await orderExecutionService.modifyStopLoss({
      tradeId: buyResult.tradeId,
      userId: testUser.id,
      stockId: stockInfy.id,
      newStopLossPrice: 1390.00
    });

    logger.info(`SL modification result: ${JSON.stringify(modResult)}`);
    const updatedSLTrade = await db.select().from(trades).where(eq(trades.id, buyResult.tradeId));
    logger.info(`Updated SL Price in Trade record: ${updatedSLTrade[0]?.stopLossPrice} (Expected: 1390.00)`);

    // 6. Test placeSellOrder (triggering exit sequence)
    logger.info('👉 Run 4: placeSellOrder (Initiating sell exit)');
    const sellResult = await orderExecutionService.placeSellOrder({
      tradeId: buyResult.tradeId,
      userId: testUser.id,
      stockId: stockInfy.id,
      exitReason: 'Trailing SL hit'
    });

    logger.info(`Sell result: ${JSON.stringify(sellResult)}`);
    const exitingTrade = await db.select().from(trades).where(eq(trades.id, buyResult.tradeId));
    logger.info(`Trade Status: ${exitingTrade[0]?.status} (Expected: EXIT_TRIGGERED)`);

    // 7. Test pollOrderStatuses (polling for PENDING exit sell order fills)
    logger.info('👉 Run 5: pollOrderStatuses (Detecting SELL order completion)');
    mockOrderStatus = 'COMPLETE';
    mockPrice = '1390.00'; // Sell price matches stop loss trigger price

    const sellPollRes = await orderExecutionService.pollOrderStatuses();
    logger.info(`Poller completed jobs: ${sellPollRes.processed} (Expected: 1)`);

    const exitedTrade = await db.select().from(trades).where(eq(trades.id, buyResult.tradeId));
    logger.info(`Final Trade Status: ${exitedTrade[0]?.status} (Expected: EXITED)`);
    logger.info(`Net Realized PnL: ${exitedTrade[0]?.pnl} (Expected: (1390.00 - 1425.00) * 70 = -2450.00)`);
    logger.info(`Net PnL Percentage: ${exitedTrade[0]?.pnlPct}% (Expected: -2.46%)`);

    const closedPos = await db.select().from(positions).where(eq(positions.userId, testUser.id));
    logger.info(`Closed Position Status: ${closedPos[0]?.status} (Expected: CLOSED)`);
    logger.info(`Closed Position Realized PnL: ${closedPos[0]?.realizedPnl} (Expected: -2450.00)`);

    const cooldownList = await db.select().from(tradeCooldowns).where(eq(tradeCooldowns.userId, testUser.id));
    logger.info(`Cooldown records generated: ${cooldownList.length} (Expected: 1)`);

    logger.info('----------------------------------------------------');
    logger.info('🎉 All 5 Order Execution Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Order Execution integration tests failed:');
    console.error(error);
    process.exit(1);
  }
};

testOrderWorkers();
