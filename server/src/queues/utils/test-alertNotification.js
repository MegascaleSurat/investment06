import 'dotenv/config';
import { db } from '../../db/index.js';
import { 
  trades, 
  tradeLogs,
  positions, 
  stocks, 
  brokerCredentials,
  users,
  strategies,
  brokers,
  alerts,
  notifications,
  engineState
} from '../../db/schema/index.js';
import alertNotificationService from '../services/alertNotification.service.js';
import logger from '../../config/logger.js';
import kiteTickerService from '../../modules/websocket/services/KiteTickerService.js';
import { eq, and } from 'drizzle-orm';

// Mock Kite connection
kiteTickerService.connect = async (userId) => {
  logger.info({ userId }, '🛡️ [MOCK TICKER] connect client socket invoked');
  return {};
};

const testAlertNotification = async () => {
  logger.info('🧪 Starting Alert & Notification Worker Integration Tests...');

  try {
    // 1. Clean up database
    logger.info('🧹 Cleaning up database tables...');
    await db.delete(alerts);
    await db.delete(notifications);
    await db.delete(engineState);
    await db.delete(tradeLogs);
    await db.delete(positions);
    await db.delete(trades);
    await db.delete(stocks);
    await db.delete(brokerCredentials);
    await db.delete(brokers);
    await db.delete(strategies);
    await db.delete(users);

    // 2. Seed test environment data
    logger.info('🌱 Seeding database for alert notification testing...');
    const [testUser] = await db.insert(users).values({
      fullName: 'Alert Test Operator',
      email: 'alerttest@test.com',
      passwordHash: 'dummy'
    }).returning();

    const [brokerZerodha] = await db.insert(brokers).values({
      name: 'ZERODHA',
      displayName: 'Zerodha Kite',
      isActive: true
    }).returning();

    const [cred] = await db.insert(brokerCredentials).values({
      userId: testUser.id,
      brokerId: brokerZerodha.id,
      apiKey: 'mockkey',
      apiSecretEncrypted: 'mocksecret_encrypted',
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

    logger.info('✅ Database successfully seeded.');
    logger.info('----------------------------------------------------');

    // 3. Test Alert Dispatching & Deduplication
    logger.info('👉 Run 1: dispatchAlert (Should write and dispatch new alert)');
    const alertPayload = {
      userId: testUser.id,
      alertName: 'MARGIN_LIMIT_EXCEEDED',
      conditionType: 'MARGIN',
      conditionConfig: {
        message: 'Free margin is running low! Under 5%',
        severity: 'WARNING'
      }
    };

    const res1 = await alertNotificationService.dispatchAlert(alertPayload);
    logger.info(`Result 1 status: ${res1.status} (Expected: DISPATCHED)`);

    // Verify DB insertion
    const savedAlerts = await db.select().from(alerts).where(eq(alerts.userId, testUser.id));
    logger.info(`Alerts in DB: ${savedAlerts.length} (Expected: 1)`);

    logger.info('👉 Run 2: dispatchAlert (Should suppress/deduplicate consecutive identical alerts)');
    const res2 = await alertNotificationService.dispatchAlert(alertPayload);
    logger.info(`Result 2 status: ${res2.status} (Expected: DEDUPLICATED)`);

    const savedAlertsPostDup = await db.select().from(alerts).where(eq(alerts.userId, testUser.id));
    logger.info(`Alerts in DB after dup attempt: ${savedAlertsPostDup.length} (Expected: 1)`);

    logger.info('----------------------------------------------------');

    // 4. Test Engine Heartbeats & Crashes
    logger.info('👉 Run 3: engine heartbeats (Storing and validating)');
    
    // Seed heartbeat for 'exit' engine (running fine)
    await alertNotificationService.recordHeartbeat('exit');
    
    // Seed heartbeat for 'tracked' engine (stale / crashed)
    const staleHeartbeatTime = new Date();
    staleHeartbeatTime.setMinutes(staleHeartbeatTime.getMinutes() - 3); // 3 minutes ago
    await db.insert(engineState).values({
      engineName: 'tracked',
      heartbeatAt: staleHeartbeatTime,
      status: 'RUNNING',
      isPaused: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Check heartbeats
    await alertNotificationService.checkEngineHeartbeats();

    // Verify 'tracked' is marked as CRASHED and alert raised
    const exitState = await db.select().from(engineState).where(eq(engineState.engineName, 'exit'));
    const trackedState = await db.select().from(engineState).where(eq(engineState.engineName, 'tracked'));

    logger.info(`Engine 'exit' status: ${exitState[0]?.status} (Expected: RUNNING)`);
    logger.info(`Engine 'tracked' status: ${trackedState[0]?.status} (Expected: CRASHED)`);

    const crashAlerts = await db.select().from(alerts).where(and(eq(alerts.userId, testUser.id), eq(alerts.alertName, 'ENGINE_CRASHED')));
    logger.info(`Engine crash alert generated: ${crashAlerts.length > 0 ? 'YES' : 'NO'} (Expected: YES)`);

    logger.info('----------------------------------------------------');

    // 5. Test Kite Reconnect backoff & limit
    logger.info('👉 Run 4: Kite Ticker Reconnection');
    
    const recRes1 = await alertNotificationService.reconnectKite(testUser.id, 1);
    logger.info(`Reconnection status (attempt 1): ${recRes1.status} (Expected: RECONNECTED)`);

    // Force failure path by mocking failure
    kiteTickerService.connect = async () => {
      throw new Error('Broker API not reachable');
    };

    const recRes5 = await alertNotificationService.reconnectKite(testUser.id, 5);
    logger.info(`Reconnection status (attempt 5): ${recRes5.status} (Expected: FAILED_PERMANENTLY)`);

    // Verify critical alert raised
    const connAlerts = await db.select().from(alerts).where(and(eq(alerts.userId, testUser.id), eq(alerts.alertName, 'KITE_CONNECTION_FAILED')));
    logger.info(`Kite Connection Failed alert generated: ${connAlerts.length > 0 ? 'YES' : 'NO'} (Expected: YES)`);

    logger.info('----------------------------------------------------');

    // 6. Test Trade Log Async writing
    logger.info('👉 Run 5: Async Trade Logging');
    const logRes = await alertNotificationService.writeTradeLog({
      tradeId: mockTrade.id,
      logType: 'INFO',
      message: 'Async write queue testing',
      metadata: JSON.stringify({ state: 'TEST' })
    });
    logger.info(`Log successfully written: ${logRes.success ? 'YES' : 'NO'}`);

    const savedLogs = await db.select().from(tradeLogs).where(eq(tradeLogs.tradeId, mockTrade.id));
    logger.info(`Logs saved in DB for trade: ${savedLogs.length} (Expected: 1)`);
    if (savedLogs.length > 0) {
      logger.info(`Log Message: ${savedLogs[0].message}`);
    }

    logger.info('----------------------------------------------------');
    logger.info('🎉 All Alert & Notification Worker integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error.message }, '❌ Alert & Notification integration tests failed:');
    process.exit(1);
  }
};

testAlertNotification();
