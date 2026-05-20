import { db } from '../../db/index.js';
import { 
  trades, 
  tradeOrders, 
  tradeLogs, 
  tradeStateHistory,
  positions, 
  positionHistory,
  stocks, 
  tradeCooldowns,
  watchlistItems,
  stockMetrics,
  sectorMetrics,
  marketMetrics
} from '../../db/schema/index.js';
import { eq, and, lte, inArray, desc, sql } from 'drizzle-orm';
import logger from '../../config/logger.js';
import kiteService from '../../modules/broker/kite.service.js';
import { queueModifyStopLossJob, queueSellOrderJob } from '../producers/orderExecution.producer.js';

class TradeManagementService {
  /**
   * 1. monitorInvestedStocks
   * Core position monitor running every 30s. Reads current price, updates PnL,
   * and triggers SL trailing if trailing milestones are met.
   */
  async monitorInvestedStocks() {
    logger.info('[TradeManagementService] Running monitorInvestedStocks...');

    const activeTrades = await db.select()
      .from(trades)
      .where(inArray(trades.status, ['ACTIVE', 'TRAILING', 'CONFIRMED']));

    let updatedCount = 0;

    for (const trade of activeTrades) {
      try {
        // Fetch current price from stocks table (updated by WebSocket live ticks)
        const [stock] = await db.select().from(stocks).where(eq(stocks.id, trade.stockId)).limit(1);
        if (!stock || !stock.lastPrice) continue;

        const currentPrice = parseFloat(stock.lastPrice);
        const entryPrice = parseFloat(trade.entryPrice) || currentPrice;
        const quantity = trade.quantity;

        const pnl = (currentPrice - entryPrice) * quantity;
        const pnlPct = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0.0;

        await db.transaction(async (tx) => {
          // Update Trade PnL
          await tx.update(trades)
            .set({ 
              pnl: String(pnl), 
              pnlPct: String(pnlPct),
              pnlPercentage: String(pnlPct),
              updatedAt: new Date() 
            })
            .where(eq(trades.id, trade.id));

          // Update Open Position
          await tx.update(positions)
            .set({
              lastTradedPrice: String(currentPrice),
              unrealizedPnl: String(pnl),
              pnlPct: String(pnlPct),
              updatedAt: new Date()
            })
            .where(
              and(
                eq(positions.userId, trade.userId),
                eq(positions.stockId, trade.stockId),
                eq(positions.status, 'OPEN')
              )
            );

          // Get open position row to record history
          const [pos] = await tx.select({ id: positions.id })
            .from(positions)
            .where(
              and(
                eq(positions.userId, trade.userId),
                eq(positions.stockId, trade.stockId),
                eq(positions.status, 'OPEN')
              )
            )
            .limit(1);

          if (pos) {
            await tx.insert(positionHistory).values({
              positionId: pos.id,
              quantity,
              averagePrice: String(entryPrice),
              pnl: String(pnl)
            });
          }
        });

        // Trigger trailing threshold check
        if (pnlPct >= 5.0 && trade.status === 'ACTIVE') {
          // Break-even trailing trigger
          await db.update(trades)
            .set({ status: 'TRAILING', updatedAt: new Date() })
            .where(eq(trades.id, trade.id));

          await db.insert(tradeStateHistory).values({
            tradeId: trade.id,
            fromState: 'ACTIVE',
            toState: 'TRAILING',
            reason: 'PnL crossed 5% break-even milestone.',
            triggeredBy: 'SYSTEM'
          });

          logger.info({ tradeId: trade.id }, 'Trade transitioned to TRAILING state (5% milestone).');
        }

        updatedCount++;
      } catch (err) {
        logger.error({ tradeId: trade.id, err: err.message }, 'Failed to monitor active trade');
      }
    }

    logger.info({ updatedCount }, '[TradeManagementService] Completed monitorInvestedStocks.');
    return { success: true, monitoredCount: updatedCount };
  }

  /**
   * 2. evaluateTrailingSL
   * Evaluates trailing stops for TRAILING trades.
   * Handles:
   * - 5%-to-entry (lock-in entry break-even SL)
   * - Dynamic steps (when price increases by step_percent, trail SL by step_percent)
   */
  async evaluateTrailingSL() {
    logger.info('[TradeManagementService] Evaluating trailing stop losses...');

    const trailingTrades = await db.select()
      .from(trades)
      .where(eq(trades.status, 'TRAILING'));

    let modificationCount = 0;

    for (const trade of trailingTrades) {
      try {
        const [stock] = await db.select().from(stocks).where(eq(stocks.id, trade.stockId)).limit(1);
        if (!stock || !stock.lastPrice) continue;

        const currentPrice = parseFloat(stock.lastPrice);
        const entryPrice = parseFloat(trade.entryPrice);
        const currentSL = parseFloat(trade.stopLossPrice) || (entryPrice * 0.98);

        // 1. Check 5%-to-entry rule (lock-in entry if SL is still below entry)
        if (currentSL < entryPrice && currentPrice >= (entryPrice * 1.05)) {
          logger.info({ tradeId: trade.id }, 'Trailing SL: locking-in break-even entry price');
          await queueModifyStopLossJob({
            tradeId: trade.id,
            userId: trade.userId,
            stockId: trade.stockId,
            newStopLossPrice: entryPrice
          });
          modificationCount++;
          continue;
        }

        // 2. Check Dynamic trailing mode (e.g. 2% step hikes)
        const stepPercent = 2.0; // 2% step hikes
        const currentTarget = parseFloat(trade.currentTarget) || (entryPrice * 1.02);

        if (currentPrice >= currentTarget) {
          const nextTarget = currentPrice * (1 + (stepPercent / 100));
          const newSL = currentSL * (1 + (stepPercent / 100));

          await db.update(trades)
            .set({ 
              currentTarget: String(nextTarget), 
              updatedAt: new Date() 
            })
            .where(eq(trades.id, trade.id));

          logger.info({ tradeId: trade.id, newSL }, 'Trailing SL: enqueuing dynamic step trailing SL modification');
          await queueModifyStopLossJob({
            tradeId: trade.id,
            userId: trade.userId,
            stockId: trade.stockId,
            newStopLossPrice: newSL
          });
          modificationCount++;
        }
      } catch (err) {
        logger.error({ tradeId: trade.id, err: err.message }, 'Failed to evaluate trailing SL');
      }
    }

    return { success: true, modificationsEnqueued: modificationCount };
  }

  /**
   * 3. evaluateExitRules
   * Runs all 5 exit rules (SL hit, 7-day no-movement, 2-day low volume, sector weakness, market protection)
   */
  async evaluateExitRules() {
    logger.info('[TradeManagementService] Evaluating exit rules...');

    const activeTrades = await db.select()
      .from(trades)
      .where(inArray(trades.status, ['ACTIVE', 'TRAILING']));

    let exitsEnqueued = 0;

    // Fetch market status once
    const [market] = await db.select().from(marketMetrics).orderBy(desc(marketMetrics.updatedAt)).limit(1);
    const isMarketCritical = market && (market.marketStatus === 'WEAK' || !market.isTradingAllowed);

    for (const trade of activeTrades) {
      try {
        const [stock] = await db.select().from(stocks).where(eq(stocks.id, trade.stockId)).limit(1);
        if (!stock || !stock.lastPrice) continue;

        const currentPrice = parseFloat(stock.lastPrice);
        const stopLossPrice = parseFloat(trade.stopLossPrice);
        const pnlPct = parseFloat(trade.pnlPct) || 0.0;
        const holdingDays = trade.holdingDays || 0;

        let exitTriggered = false;
        let exitReason = '';

        // Rule 1: Stop Loss (SL) Hit
        if (stopLossPrice > 0 && currentPrice <= stopLossPrice) {
          exitTriggered = true;
          exitReason = `Stop Loss Hit at ${currentPrice}`;
        }

        // Rule 2: 7-day no-movement (holding > 7 days and PnL < 1%)
        if (!exitTriggered && holdingDays >= 7 && pnlPct < 1.0) {
          exitTriggered = true;
          exitReason = '7-day no-movement rule triggered';
        }

        // Fetch stock specific metrics
        const [metric] = await db.select().from(stockMetrics).where(eq(stockMetrics.stockId, trade.stockId)).limit(1);

        // Rule 3: Low Volume Exit (volume ratio < 0.3)
        if (!exitTriggered && metric && parseFloat(metric.volumeRatio) < 0.3) {
          exitTriggered = true;
          exitReason = `Low volume ratio (${metric.volumeRatio}) exit`;
        }

        // Rule 4: Sector Weakness Exit
        if (!exitTriggered && stock.sectorId) {
          const [sectorMetric] = await db.select()
            .from(sectorMetrics)
            .where(eq(sectorMetrics.sectorId, stock.sectorId))
            .limit(1);
          if (sectorMetric && sectorMetric.sectorStatus === 'WEAK') {
            exitTriggered = true;
            exitReason = 'Sector weakness exit';
          }
        }

        // Rule 5: Market Protection Exit (Critical global market status)
        if (!exitTriggered && isMarketCritical) {
          exitTriggered = true;
          exitReason = 'Market protection critical exit';
        }

        // Trigger Exit sell order
        if (exitTriggered) {
          logger.warn({ tradeId: trade.id, exitReason }, '🚨 Exit rule matched. Initiating trade exit...');

          await db.transaction(async (tx) => {
            await tx.update(trades)
              .set({ status: 'EXIT_TRIGGERED', remarks: exitReason, updatedAt: new Date() })
              .where(eq(trades.id, trade.id));

            await tx.insert(tradeStateHistory).values({
              tradeId: trade.id,
              fromState: trade.status,
              toState: 'EXIT_TRIGGERED',
              reason: exitReason,
              transitionReason: exitReason,
              triggeredBy: 'SYSTEM'
            });

            await tx.insert(tradeLogs).values({
              tradeId: trade.id,
              logType: 'WARNING',
              message: `Exit rule triggered: ${exitReason}`
            });
          });

          // Enqueue sell job
          await queueSellOrderJob({
            tradeId: trade.id,
            userId: trade.userId,
            stockId: trade.stockId,
            exitReason
          });

          exitsEnqueued++;
        }
      } catch (err) {
        logger.error({ tradeId: trade.id, err: err.message }, 'Failed to evaluate exit rules for trade');
      }
    }

    return { success: true, exitsEnqueued };
  }

  /**
   * 4. incrementHoldingDays
   * Increments holding_days counter for all open positions once per trading day.
   */
  async incrementHoldingDays() {
    logger.info('[TradeManagementService] Incrementing holding days for all open trades...');
    
    await db.transaction(async (tx) => {
      // Increment holding days in trades table
      await tx.update(trades)
        .set({ 
          holdingDays: sql`holding_days + 1`, 
          updatedAt: new Date() 
        })
        .where(inArray(trades.status, ['ACTIVE', 'TRAILING', 'CONFIRMED']));

      // Increment holding days in positions table
      await tx.update(positions)
        .set({ 
          holdingDays: sql`holding_days + 1`, 
          updatedAt: new Date() 
        })
        .where(eq(positions.status, 'OPEN'));
    });

    logger.info('[TradeManagementService] Increment holding days completed.');
    return { success: true };
  }

  /**
   * 5. processCooldownTracker
   * Release stocks from cooldown once 1 trading day has elapsed.
   */
  async processCooldownTracker() {
    logger.info('[TradeManagementService] Running cooldown tracker...');
    
    const released = await db.update(tradeCooldowns)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(tradeCooldowns.isActive, true),
          lte(tradeCooldowns.cooldownExpires, new Date())
        )
      )
      .returning();

    logger.info({ releasedCount: released.length }, 'Cooldown records cleared.');
    return { success: true, releasedCount: released.length };
  }

  /**
   * 6. processPartialFill
   * Handles partial fills: creates positions with partial quantities, places immediate SL,
   * and tracks remainder fills.
   */
  async processPartialFill({ tradeId, orderId, filledQuantity, fillPrice, remainingQuantity }) {
    logger.info({ tradeId, filledQuantity }, '[TradeManagementService] Processing partial fill event...');

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
    if (!trade) throw new Error(`Trade not found with ID ${tradeId}`);

    const [stock] = await db.select().from(stocks).where(eq(stocks.id, trade.stockId)).limit(1);
    if (!stock) throw new Error(`Stock not found with ID ${trade.stockId}`);

    let positionId;

    await db.transaction(async (tx) => {
      // 1. Fetch or create open position
      const [existingPos] = await tx.select()
        .from(positions)
        .where(
          and(
            eq(positions.userId, trade.userId),
            eq(positions.stockId, trade.stockId),
            eq(positions.status, 'OPEN')
          )
        )
        .limit(1);

      if (existingPos) {
        const oldQty = existingPos.quantity;
        const oldAvg = parseFloat(existingPos.averagePrice);
        const newQty = oldQty + filledQuantity;
        const newAvgPrice = ((oldQty * oldAvg) + (filledQuantity * fillPrice)) / newQty;

        await tx.update(positions)
          .set({
            quantity: newQty,
            averagePrice: String(newAvgPrice),
            updatedAt: new Date()
          })
          .where(eq(positions.id, existingPos.id));

        positionId = existingPos.id;

        await tx.insert(positionHistory).values({
          positionId: existingPos.id,
          quantity: newQty,
          averagePrice: String(newAvgPrice)
        });
      } else {
        const [newPos] = await tx.insert(positions).values({
          userId: trade.userId,
          brokerConnectionId: trade.brokerConnectionId,
          stockId: trade.stockId,
          productType: trade.productType,
          quantity: filledQuantity,
          averagePrice: String(fillPrice),
          status: 'OPEN',
          positionStatus: 'ACTIVE',
          openedAt: new Date()
        }).returning();

        positionId = newPos.id;

        await tx.insert(positionHistory).values({
          positionId: newPos.id,
          quantity: filledQuantity,
          averagePrice: String(fillPrice)
        });
      }

      // 2. Update buy order filledQuantity
      await tx.update(tradeOrders)
        .set({
          filledQuantity,
          status: remainingQuantity === 0 ? 'COMPLETE' : 'PARTIALLY_FILLED',
          updatedAt: new Date()
        })
        .where(eq(tradeOrders.id, orderId));

      // 3. Update Trade record
      await tx.update(trades)
        .set({
          status: 'ACTIVE',
          quantity: filledQuantity + (trade.quantity - remainingQuantity), // increment filled
          entryPrice: String(fillPrice),
          updatedAt: new Date()
        })
        .where(eq(trades.id, tradeId));

      await tx.insert(tradeLogs).values({
        tradeId,
        logType: 'INFO',
        message: `PARTIAL FILL recorded: ${filledQuantity} shares filled at ${fillPrice}. Remaining: ${remainingQuantity}`
      });
    });

    // 4. Place Stop Loss for the partially filled quantity immediately
    let stopLossPrice = fillPrice * 0.98;
    const [watchlist] = await db.select()
      .from(watchlistItems)
      .where(eq(watchlistItems.stockId, trade.stockId))
      .limit(1);
    if (watchlist && watchlist.stopLoss) {
      stopLossPrice = parseFloat(watchlist.stopLoss);
    }
    stopLossPrice = Math.round(stopLossPrice * 20) / 20;

    let kiteResult;
    try {
      kiteResult = await kiteService.placeOrder(trade.userId, {
        symbol: stock.symbol,
        exchange: stock.exchange,
        transaction_type: 'SELL',
        order_type: 'SL-M',
        quantity: filledQuantity,
        trigger_price: stopLossPrice,
        product: trade.productType
      });

      await db.insert(tradeOrders).values({
        tradeId,
        brokerOrderId: kiteResult.order_id,
        orderType: 'SL-M',
        transactionType: 'SELL',
        quantity: filledQuantity,
        triggerPrice: String(stopLossPrice),
        status: 'PENDING'
      });

      logger.info({ slOrderId: kiteResult.order_id }, 'Stop Loss placed successfully for partial fill');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to place Stop Loss for partial fill quantity');
    }

    const { default: eventBus } = await import('../../modules/websocket/utils/eventBus.js');
    const { INTERNAL_EVENTS } = await import('../../modules/websocket/constants/events.js');

    eventBus.emit(INTERNAL_EVENTS.TRADE_POSITION_UPDATED, {
      tradeId,
      status: 'ACTIVE',
      positionId
    });

    return { success: true, positionId };
  }
}

export default new TradeManagementService();
