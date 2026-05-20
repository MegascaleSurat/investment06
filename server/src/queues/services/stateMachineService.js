import { db } from '../../db/index.js';
import { 
  trades, 
  tradeOrders, 
  tradeLogs, 
  tradeStateHistory,
  positions
} from '../../db/schema/index.js';
import { eq, and, lte, inArray } from 'drizzle-orm';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import kiteTickerService from '../../modules/websocket/services/KiteTickerService.js';
import eventBus from '../../modules/websocket/utils/eventBus.js';
import { INTERNAL_EVENTS } from '../../modules/websocket/constants/events.js';
import { queueOrderStatusPollerJob } from '../producers/orderExecution.producer.js';

// State Machine transition rules
const VALID_TRANSITIONS = {
  'NEW': ['ORDER_PLACED', 'CANCELLED'],
  'ORDER_PLACED': ['ACTIVE', 'PARTIALLY_FILLED', 'CANCELLED'],
  'PARTIALLY_FILLED': ['ACTIVE', 'CANCELLED'],
  'ACTIVE': ['TRAILING', 'EXIT_TRIGGERED', 'EXITED', 'CANCELLED'],
  'TRAILING': ['EXIT_TRIGGERED', 'EXITED', 'CANCELLED'],
  'EXIT_TRIGGERED': ['EXITED'],
  'EXITED': [],
  'CANCELLED': []
};

class StateMachineService {
  /**
   * 1. processTransition
   * Receives state change events from all engines and validates each transition.
   */
  async processTransition({ tradeId, toState, reason, triggeredBy }) {
    logger.info({ tradeId, toState }, '[StateMachineService] Processing state transition request...');

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
    if (!trade) {
      throw new Error(`Trade with ID ${tradeId} not found`);
    }

    const fromState = trade.status;

    // Idempotent check
    if (fromState === toState) {
      logger.info({ tradeId, toState }, '[StateMachineService] Trade is already in requested state. No transition needed.');
      return { success: true, message: 'State already matched.' };
    }

    // Validate Transition
    const allowed = VALID_TRANSITIONS[fromState] || [];
    if (!allowed.includes(toState)) {
      const errMessage = `Invalid state transition from ${fromState} to ${toState} for trade ${tradeId}`;
      logger.error({ tradeId, fromState, toState }, `❌ [StateMachineService] ${errMessage}`);
      throw new Error(errMessage);
    }

    // Execute state transition update
    await db.transaction(async (tx) => {
      await tx.update(trades)
        .set({ 
          status: toState, 
          updatedAt: new Date() 
        })
        .where(eq(trades.id, tradeId));

      await tx.insert(tradeStateHistory).values({
        tradeId,
        fromState,
        toState,
        reason: reason || 'Transition requested by system.',
        transitionReason: reason || 'Transition requested by system.',
        triggeredBy: triggeredBy || 'SYSTEM'
      });

      await tx.insert(tradeLogs).values({
        tradeId,
        logType: 'INFO',
        message: `State transitioned from ${fromState} to ${toState}. Reason: ${reason || 'None'}`
      });
    });

    logger.info({ tradeId, fromState, toState }, '✅ [StateMachineService] Transition executed successfully');

    // Notify websocket event listeners
    eventBus.emit(INTERNAL_EVENTS.TRADE_POSITION_UPDATED, {
      tradeId,
      status: toState
    });

    return { success: true, fromState, toState };
  }

  /**
   * 2. detectStuckOrders
   * Scans trade_orders for any order stuck in ORDER_PLACED or PENDING state for more than 5 minutes.
   * Fetches status from Kite, updates local status if possible, and escalates to admin.
   */
  async detectStuckOrders() {
    logger.info('[StateMachineService] Scanning for stuck trade orders...');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const stuckOrders = await db.select()
      .from(tradeOrders)
      .where(
        and(
          inArray(tradeOrders.status, ['PENDING', 'SUBMITTED']),
          lte(tradeOrders.createdAt, fiveMinutesAgo)
        )
      );

    let stuckResolvedCount = 0;

    for (const order of stuckOrders) {
      try {
        const [trade] = await db.select().from(trades).where(eq(trades.id, order.tradeId)).limit(1);
        if (!trade) continue;

        logger.warn({ orderId: order.id, brokerOrderId: order.brokerOrderId }, '🔍 Stuck order detected! Fetching current status from Kite...');

        // Query status from Kite API
        const latestKiteInfo = await kiteService.getOrderInfo(trade.userId, order.brokerOrderId);
        
        let targetStatus = order.status;
        if (latestKiteInfo.status === 'COMPLETE') {
          targetStatus = 'COMPLETE';
        } else if (latestKiteInfo.status === 'REJECTED') {
          targetStatus = 'REJECTED';
        } else if (latestKiteInfo.status === 'CANCELLED') {
          targetStatus = 'CANCELLED';
        }

        if (targetStatus !== order.status) {
          // If status has changed on Kite, resolve locally
          await db.transaction(async (tx) => {
            await tx.update(tradeOrders)
              .set({
                status: targetStatus,
                filledQuantity: latestKiteInfo.filled_quantity || order.quantity,
                updatedAt: new Date()
              })
              .where(eq(tradeOrders.id, order.id));

            await tx.insert(tradeLogs).values({
              tradeId: trade.id,
              logType: 'WARNING',
              message: `Stuck order ${order.brokerOrderId} resolved. Status updated from Kite: ${targetStatus}`
            });
          });

          // Trigger reconciliation job for this order's trade
          await queueOrderStatusPollerJob({
            tradeId: trade.id,
            userId: trade.userId
          });

          logger.info({ brokerOrderId: order.brokerOrderId, status: targetStatus }, 'Stuck order successfully resolved from Kite.');
          stuckResolvedCount++;
        } else {
          // Still stuck/pending on broker
          logger.error({ brokerOrderId: order.brokerOrderId }, '🚨 Escalation: Order is still stuck on Kite broker. Requiring admin review.');
          
          await db.insert(tradeLogs).values({
            tradeId: trade.id,
            logType: 'ERROR',
            message: `CRITICAL: Order ${order.brokerOrderId} remains stuck in status PENDING for > 5 min.`
          });
        }
      } catch (err) {
        logger.error({ orderId: order.id, err: err.message }, 'Failed to check/resolve stuck order');
      }
    }

    return { success: true, resolvedCount: stuckResolvedCount };
  }

  /**
   * 3. runCrashRecovery
   * Runs on system restart. Restores active Kite WebSocket tickers for users,
   * re-subscribes active instrument tokens, and resumes pending reconciliation schedules.
   */
  async runCrashRecovery() {
    logger.info('[StateMachineService] Initiating crash recovery sequence...');

    // 1. Find all users with open positions
    const openPositions = await db.select({ userId: positions.userId })
      .from(positions)
      .where(eq(positions.status, 'OPEN'));

    const activeUserIds = [...new Set(openPositions.map(p => p.userId))];

    logger.info({ activeUserIdsCount: activeUserIds.length }, 'Found users requiring Ticker reconnect on boot');

    let tickerReconnects = 0;
    for (const userId of activeUserIds) {
      try {
        logger.info({ userId }, 'Re-establishing Kite Ticker subscription...');
        await kiteTickerService.connect(userId);
        tickerReconnects++;
      } catch (err) {
        logger.error({ userId, err: err.message }, 'Failed to reconnect Kite Ticker for user during crash recovery');
      }
    }

    // 2. Scan for trades in ORDER_PLACED or EXIT_TRIGGERED that might need polling checks
    const pendingTrades = await db.select()
      .from(trades)
      .where(inArray(trades.status, ['ORDER_PLACED', 'EXIT_TRIGGERED']));

    let recoveryJobsQueued = 0;
    for (const trade of pendingTrades) {
      try {
        await queueOrderStatusPollerJob({
          tradeId: trade.id,
          userId: trade.userId
        });
        recoveryJobsQueued++;
      } catch (err) {
        logger.error({ tradeId: trade.id, err: err.message }, 'Failed to queue order status poller job during recovery');
      }
    }

    logger.info(
      { tickerReconnects, recoveryJobsQueued },
      '[StateMachineService] Crash recovery sequence completed.'
    );

    return { success: true, tickerReconnects, recoveryJobsQueued };
  }
}

export default new StateMachineService();
