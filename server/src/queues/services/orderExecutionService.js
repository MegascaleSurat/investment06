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
  watchlistItems
} from '../../db/schema/index.js';
import { eq, and, desc, lte, inArray } from 'drizzle-orm';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';

class OrderExecutionService {
  /**
   * 1. placeBuyOrder
   * Triggered when a BUY signal is generated. Places target order on Kite.
   */
  async placeBuyOrder({ userId, stockId, strategyId, price, allocationModifier }) {
    logger.info({ userId, stockId }, '[OrderExecutionService] Initiating placeBuyOrder execution...');

    // 1. Cooldown & Duplicate Check
    const isDuplicate = await this._hasActivePosition(userId, stockId);
    if (isDuplicate) {
      logger.warn({ userId, stockId }, '[OrderExecutionService] Duplicate order check rejected. Active position exists.');
      return { status: 'REJECTED', reason: 'DUPLICATE_ACTIVE_POSITION' };
    }

    const isCooldownActive = await this._isCooldownActive(userId, stockId);
    if (isCooldownActive) {
      logger.warn({ userId, stockId }, '[OrderExecutionService] Cooldown active for this stock. Skipping placement.');
      return { status: 'REJECTED', reason: 'COOLDOWN_ACTIVE' };
    }

    // 2. Fetch stock details
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, stockId)).limit(1);
    if (!stock) throw new Error(`Stock not found with ID ${stockId}`);

    // 3. Fetch broker credentials
    const [cred] = await db.select().from(brokerCredentials).where(eq(brokerCredentials.userId, userId)).limit(1);
    if (!cred) throw new Error(`Broker credentials not found for user ${userId}`);

    // 4. Calculate Quantity
    const capAlloc = await db.select()
      .from(capitalAllocation)
      .where(
        and(
          eq(capitalAllocation.userId, userId),
          eq(capitalAllocation.strategyId, strategyId),
          eq(capitalAllocation.isActive, true)
        )
      )
      .limit(1);

    let amount = capAlloc.length > 0 ? parseFloat(capAlloc[0].allocatedAmount) : 50000.00;
    if (allocationModifier) {
      amount = amount * allocationModifier;
    }
    const quantity = Math.floor(amount / price);
    if (quantity <= 0) {
      logger.error({ amount, price }, '[OrderExecutionService] Computed quantity is zero. Insufficient capital.');
      throw new Error(`Insufficient capital allocation (allocated: ${amount}, price: ${price})`);
    }

    // 5. Place order on Kite
    logger.info({ symbol: stock.symbol, quantity }, '[OrderExecutionService] Placing order on Kite Connect...');
    
    let kiteResult;
    try {
      kiteResult = await kiteService.placeOrder(userId, {
        symbol: stock.symbol,
        exchange: stock.exchange,
        transaction_type: 'BUY',
        order_type: 'MARKET',
        quantity,
        product: 'MIS' // Default to Intraday
      });
    } catch (err) {
      logger.error({ err: err.message }, '[OrderExecutionService] Kite order placement failed');
      throw err;
    }

    // 6. DB Transaction for Trade and Order creation
    let tradeRecord;
    let orderRecord;

    await db.transaction(async (tx) => {
      [tradeRecord] = await tx.insert(trades).values({
        userId,
        strategyId,
        stockId,
        brokerConnectionId: cred.id,
        tradeType: 'BUY',
        productType: 'MIS',
        quantity,
        entryPrice: String(price),
        status: 'ORDER_PLACED'
      }).returning();

      [orderRecord] = await tx.insert(tradeOrders).values({
        tradeId: tradeRecord.id,
        brokerOrderId: kiteResult.order_id,
        orderType: 'MARKET',
        transactionType: 'BUY',
        quantity,
        price: String(price),
        status: 'PENDING'
      }).returning();

      // Log execution trace
      await tx.insert(tradeLogs).values({
        tradeId: tradeRecord.id,
        logType: 'INFO',
        message: `Market BUY order placed on Kite. Order ID: ${kiteResult.order_id}`,
        metadata: JSON.stringify(kiteResult)
      });

      await tx.insert(tradeStateHistory).values({
        tradeId: tradeRecord.id,
        fromState: 'NEW',
        toState: 'ORDER_PLACED',
        reason: 'Initial market buy order sent to broker.',
        triggeredBy: 'SYSTEM'
      });
    });

    const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
    const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');
    
    eventBus.emit(INTERNAL_EVENTS.TRADE_ORDER_UPDATED, {
      tradeId: tradeRecord.id,
      orderId: orderRecord.id,
      brokerOrderId: kiteResult.order_id,
      status: 'PENDING'
    });

    return { tradeId: tradeRecord.id, orderId: orderRecord.id, brokerOrderId: kiteResult.order_id };
  }

  /**
   * 2. placeStopLoss
   * Places the initial stop loss order (SL-M) once target BUY is filled.
   */
  async placeStopLoss({ tradeId, userId, stockId, quantity, entryPrice }) {
    logger.info({ tradeId, stockId }, '[OrderExecutionService] Placing Stop Loss order...');

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
    if (!trade) throw new Error(`Trade record not found: ${tradeId}`);

    const [stock] = await db.select().from(stocks).where(eq(stocks.id, stockId)).limit(1);
    if (!stock) throw new Error(`Stock not found with ID ${stockId}`);

    // Compute SL Price (default to 2% below entry)
    let stopLossPrice = entryPrice * 0.98;
    const [watchlist] = await db.select()
      .from(watchlistItems)
      .where(eq(watchlistItems.stockId, stockId))
      .limit(1);
    if (watchlist && watchlist.stopLoss) {
      stopLossPrice = parseFloat(watchlist.stopLoss);
    }

    // Round SL Price to nearest tick (0.05)
    stopLossPrice = Math.round(stopLossPrice * 20) / 20;

    let kiteResult;
    try {
      // Place SL order as Stop Loss Market (SL-M)
      kiteResult = await kiteService.placeOrder(userId, {
        symbol: stock.symbol,
        exchange: stock.exchange,
        transaction_type: 'SELL',
        order_type: 'SL-M',
        quantity,
        trigger_price: stopLossPrice,
        product: 'MIS'
      });
    } catch (err) {
      logger.error({ err: err.message }, '[OrderExecutionService] Stop Loss order placement failed');
      // Create high-priority alert
      const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
      const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');
      
      eventBus.emit(INTERNAL_EVENTS.ALERT_NEW_RAISED, {
        tradeId,
        alertType: 'CRITICAL',
        message: `FAILED to place Stop Loss for ${stock.symbol}! Immediate intervention required.`,
        error: err.message
      });
      throw err; // bubble up for retry
    }

    await db.transaction(async (tx) => {
      await tx.insert(tradeOrders).values({
        tradeId,
        brokerOrderId: kiteResult.order_id,
        orderType: 'SL-M',
        transactionType: 'SELL',
        quantity,
        triggerPrice: String(stopLossPrice),
        status: 'PENDING'
      });

      await tx.update(trades)
        .set({ stopLossPrice: String(stopLossPrice) })
        .where(eq(trades.id, tradeId));

      await tx.insert(tradeLogs).values({
        tradeId,
        logType: 'INFO',
        message: `Stop Loss order placed on Kite at trigger price ${stopLossPrice}. Order ID: ${kiteResult.order_id}`
      });
    });

    return { slOrderId: kiteResult.order_id, stopLossPrice };
  }

  /**
   * 3. modifyStopLoss
   * Modifies an existing stop loss trigger price during trailing steps.
   */
  async modifyStopLoss({ tradeId, userId, newStopLossPrice }) {
    logger.info({ tradeId, newStopLossPrice }, '[OrderExecutionService] Modifying Stop Loss...');

    const roundedPrice = Math.round(newStopLossPrice * 20) / 20;

    // Find the pending Stop Loss order
    const [slOrder] = await db.select()
      .from(tradeOrders)
      .where(
        and(
          eq(tradeOrders.tradeId, tradeId),
          eq(tradeOrders.orderType, 'SL-M'),
          eq(tradeOrders.status, 'PENDING')
        )
      )
      .limit(1);

    if (!slOrder) {
      throw new Error(`Pending Stop Loss order not found for trade ${tradeId}`);
    }

    try {
      await kiteService.modifyOrder(userId, slOrder.brokerOrderId, {
        trigger_price: roundedPrice
      });
    } catch (err) {
      logger.error({ err: err.message }, '[OrderExecutionService] Kite SL modification failed');
      throw err;
    }

    await db.transaction(async (tx) => {
      await tx.update(tradeOrders)
        .set({ triggerPrice: String(roundedPrice) })
        .where(eq(tradeOrders.id, slOrder.id));

      await tx.update(trades)
        .set({ stopLossPrice: String(roundedPrice) })
        .where(eq(trades.id, tradeId));

      await tx.insert(tradeLogs).values({
        tradeId,
        logType: 'INFO',
        message: `Stop Loss trailing price modified on Kite to ${roundedPrice}.`
      });
    });

    return { success: true, updatedPrice: roundedPrice };
  }

  /**
   * 4. placeSellOrder
   * Triggered when target price is hit, stop loss trigger is hit, or manual exit is clicked.
   */
  async placeSellOrder({ tradeId, userId, stockId, exitReason }) {
    logger.info({ tradeId, exitReason }, '[OrderExecutionService] Placing exit SELL order...');

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
    if (!trade) throw new Error(`Trade record not found: ${tradeId}`);

    const [stock] = await db.select().from(stocks).where(eq(stocks.id, stockId)).limit(1);
    if (!stock) throw new Error(`Stock not found with ID ${stockId}`);

    let kiteResult;
    try {
      kiteResult = await kiteService.placeOrder(userId, {
        symbol: stock.symbol,
        exchange: stock.exchange,
        transaction_type: 'SELL',
        order_type: 'MARKET',
        quantity: trade.quantity,
        product: 'MIS'
      });
    } catch (err) {
      logger.error({ err: err.message }, '[OrderExecutionService] Exit SELL order placement failed');
      throw err;
    }

    let sellOrder;
    await db.transaction(async (tx) => {
      await tx.update(trades)
        .set({ status: 'EXIT_TRIGGERED', remarks: exitReason })
        .where(eq(trades.id, tradeId));

      [sellOrder] = await tx.insert(tradeOrders).values({
        tradeId,
        brokerOrderId: kiteResult.order_id,
        orderType: 'MARKET',
        transactionType: 'SELL',
        quantity: trade.quantity,
        status: 'PENDING'
      }).returning();

      await tx.insert(tradeLogs).values({
        tradeId,
        logType: 'INFO',
        message: `Exit SELL order placed on Kite. Order ID: ${kiteResult.order_id}. Reason: ${exitReason}`
      });

      await tx.insert(tradeStateHistory).values({
        tradeId,
        fromState: trade.status,
        toState: 'EXIT_TRIGGERED',
        reason: exitReason,
        triggeredBy: 'SYSTEM'
      });
    });

    const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
    const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

    eventBus.emit(INTERNAL_EVENTS.TRADE_ORDER_UPDATED, {
      tradeId,
      orderId: sellOrder.id,
      brokerOrderId: kiteResult.order_id,
      status: 'PENDING'
    });

    return { sellOrderId: kiteResult.order_id };
  }

  /**
   * 5. pollOrderStatuses
   * Cron fallback to query statuses of pending orders that did not receive WebSocket callbacks.
   */
  async pollOrderStatuses() {
    logger.info('[OrderExecutionService] Polling pending order statuses from broker...');
    try {
      const pendingOrders = await db.select({
        id: tradeOrders.id,
        tradeId: tradeOrders.tradeId,
        brokerOrderId: tradeOrders.brokerOrderId,
        transactionType: tradeOrders.transactionType,
        quantity: tradeOrders.quantity,
        userId: trades.userId,
        stockId: trades.stockId,
        price: tradeOrders.price
      })
      .from(tradeOrders)
      .innerJoin(trades, eq(tradeOrders.tradeId, trades.id))
      .where(eq(tradeOrders.status, 'PENDING'));

      let processedCount = 0;

      for (const order of pendingOrders) {
        if (!order.brokerOrderId) continue;

        try {
          const brokerDetails = await kiteService.getOrderInfo(order.userId, order.brokerOrderId);
          if (brokerDetails.status === 'COMPLETE') {
            const fillPrice = parseFloat(brokerDetails.average_price) || parseFloat(order.price) || 0.0;
            await this.confirmOrderExecution(order.id, fillPrice);
            processedCount++;
          } else if (['REJECTED', 'CANCELLED'].includes(brokerDetails.status)) {
            await this.cancelOrderExecution(order.id, brokerDetails.status, brokerDetails.status_message);
            processedCount++;
          }
        } catch (err) {
          logger.warn({ orderId: order.id, err: err.message }, 'Failed to poll order info from Kite');
        }
      }

      logger.info({ processedCount }, '[OrderExecutionService] Finished order status polling.');
      return { success: true, processed: processedCount };
    } catch (error) {
      logger.error('❌ Error in pollOrderStatuses:', error);
      throw error;
    }
  }

  /**
   * Complete Order and update trade state machine
   */
  async confirmOrderExecution(orderId, fillPrice) {
    logger.info({ orderId, fillPrice }, '[OrderExecutionService] Confirming order completion...');
    
    const [order] = await db.select().from(tradeOrders).where(eq(tradeOrders.id, orderId)).limit(1);
    if (!order) return;

    const [trade] = await db.select().from(trades).where(eq(trades.id, order.tradeId)).limit(1);
    if (!trade) return;

    const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
    const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

    await db.transaction(async (tx) => {
      // 1. Complete order record
      await tx.update(tradeOrders)
        .set({ status: 'COMPLETE', filledQuantity: order.quantity, updatedAt: new Date() })
        .where(eq(tradeOrders.id, orderId));

      // 2. State-specific logic
      if (order.transactionType === 'BUY') {
        // Transition trade to ACTIVE
        await tx.update(trades)
          .set({ 
            status: 'ACTIVE', 
            entryPrice: String(fillPrice), 
            entryTime: new Date(), 
            updatedAt: new Date() 
          })
          .where(eq(trades.id, trade.id));

        // Create open position record
        const [pos] = await tx.insert(positions).values({
          userId: trade.userId,
          brokerConnectionId: trade.brokerConnectionId,
          stockId: trade.stockId,
          productType: trade.productType,
          quantity: trade.quantity,
          averagePrice: String(fillPrice),
          status: 'OPEN',
          positionStatus: 'ACTIVE',
          openedAt: new Date()
        }).returning();

        await tx.insert(positionHistory).values({
          positionId: pos.id,
          quantity: trade.quantity,
          averagePrice: String(fillPrice)
        });

        await tx.insert(tradeLogs).values({
          tradeId: trade.id,
          logType: 'INFO',
          message: `BUY order filled at ${fillPrice}. Position opened.`
        });

        await tx.insert(tradeStateHistory).values({
          tradeId: trade.id,
          fromState: 'ORDER_PLACED',
          toState: 'ACTIVE',
          reason: 'Buy order filled. Position opened.',
          triggeredBy: 'BROKER'
        });

        // Trigger stop loss placement queue job via producer
        const { queueStopLossJob } = await import('../producers/orderExecution.producer.js');
        await queueStopLossJob({
          tradeId: trade.id,
          userId: trade.userId,
          stockId: trade.stockId,
          quantity: trade.quantity,
          entryPrice: fillPrice
        });

        eventBus.emit(INTERNAL_EVENTS.TRADE_POSITION_UPDATED, {
          tradeId: trade.id,
          status: 'ACTIVE',
          positionId: pos.id
        });

      } else if (order.transactionType === 'SELL') {
        // Transition trade to EXITED
        const entryPrice = parseFloat(trade.entryPrice) || 0.0;
        const pnl = (fillPrice - entryPrice) * trade.quantity;
        const pnlPct = entryPrice > 0 ? ((fillPrice - entryPrice) / entryPrice) * 100 : 0.0;

        await tx.update(trades)
          .set({
            status: 'EXITED',
            exitTime: new Date(),
            pnl: String(pnl),
            pnlPct: String(pnlPct),
            updatedAt: new Date()
          })
          .where(eq(trades.id, trade.id));

        // Close position record
        await tx.update(positions)
          .set({
            status: 'CLOSED',
            closedAt: new Date(),
            realizedPnl: String(pnl),
            pnlPct: String(pnlPct),
            exitReason: trade.remarks || 'Exit rule met',
            updatedAt: new Date()
          })
          .where(
            and(
              eq(positions.userId, trade.userId),
              eq(positions.stockId, trade.stockId),
              eq(positions.status, 'OPEN')
            )
          );

        // Cancel any pending SL orders for this trade on Kite
        const pendingSlOrders = await tx.select()
          .from(tradeOrders)
          .where(
            and(
              eq(tradeOrders.tradeId, trade.id),
              eq(tradeOrders.orderType, 'SL-M'),
              eq(tradeOrders.status, 'PENDING')
            )
          );

        for (const sl of pendingSlOrders) {
          try {
            await kiteService.cancelOrder(trade.userId, sl.brokerOrderId);
            await tx.update(tradeOrders)
              .set({ status: 'CANCELLED', updatedAt: new Date() })
              .where(eq(tradeOrders.id, sl.id));
          } catch (cancelErr) {
            logger.warn({ brokerOrderId: sl.brokerOrderId, err: cancelErr.message }, 'Failed to cancel stale SL on broker');
          }
        }

        // Apply trade cooldown
        const cooldownExpires = new Date();
        cooldownExpires.setHours(cooldownExpires.getHours() + 24); // 24-hr cooldown
        
        await tx.insert(tradeCooldowns).values({
          stockId: trade.stockId,
          userId: trade.userId,
          tradeId: trade.id,
          cooldownStart: new Date(),
          cooldownExpires,
          isActive: true
        });

        await tx.insert(tradeLogs).values({
          tradeId: trade.id,
          logType: 'INFO',
          message: `SELL order filled at ${fillPrice}. Net PnL: ${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%). Position closed.`
        });

        await tx.insert(tradeStateHistory).values({
          tradeId: trade.id,
          fromState: 'EXIT_TRIGGERED',
          toState: 'EXITED',
          reason: 'Sell order filled. Position closed and SL cancelled.',
          triggeredBy: 'BROKER'
        });

        eventBus.emit(INTERNAL_EVENTS.TRADE_CLOSED_COMPLETED, {
          tradeId: trade.id,
          status: 'EXITED',
          pnl,
          pnlPct
        });
      }
    });
  }

  /**
   * Cancel or Reject execution update
   */
  async cancelOrderExecution(orderId, status, reason) {
    logger.warn({ orderId, status, reason }, '[OrderExecutionService] Order rejected or cancelled.');
    
    const [order] = await db.select().from(tradeOrders).where(eq(tradeOrders.id, orderId)).limit(1);
    if (!order) return;

    await db.transaction(async (tx) => {
      await tx.update(tradeOrders)
        .set({ status: status === 'REJECTED' ? 'REJECTED' : 'CANCELLED', updatedAt: new Date() })
        .where(eq(tradeOrders.id, orderId));

      await tx.update(trades)
        .set({ status: 'FAILED', remarks: `Order ${status}: ${reason}`, updatedAt: new Date() })
        .where(eq(trades.id, order.tradeId));

      await tx.insert(tradeLogs).values({
        tradeId: order.tradeId,
        logType: 'ERROR',
        message: `Order execution ${status}. Reason: ${reason}`
      });
    });
  }

  /**
   * Helper duplicate position check
   */
  async _hasActivePosition(userId, stockId) {
    const [record] = await db.select({ id: trades.id })
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          eq(trades.stockId, stockId),
          inArray(trades.status, ['ORDER_PLACED', 'ACTIVE', 'TRAILING', 'CONFIRMED'])
        )
      )
      .limit(1);
    return !!record;
  }

  /**
   * Helper cooldown verification
   */
  async _isCooldownActive(userId, stockId) {
    const [cooldown] = await db.select()
      .from(tradeCooldowns)
      .where(
        and(
          eq(tradeCooldowns.userId, userId),
          eq(tradeCooldowns.stockId, stockId),
          eq(tradeCooldowns.isActive, true),
          lte(tradeCooldowns.cooldownStart, new Date())
        )
      )
      .orderBy(desc(tradeCooldowns.cooldownExpires))
      .limit(1);

    if (!cooldown) return false;
    return new Date() < new Date(cooldown.cooldownExpires);
  }
}

export default new OrderExecutionService();
