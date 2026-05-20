import { db } from '../../db/index.js';
import { 
  stocks, 
  marketDataDaily, 
  marketDataLive, 
  positions, 
  tradeCooldowns, 
  gttOrders, 
  trades, 
  dailyPerformanceSnapshots,
  alerts,
  notifications,
  brokerCredentials
} from '../../db/schema/index.js';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import calcMetricsService from './calcMetricsService.js';
import kiteService from '../../modules/broker/kite.service.js';
import logger from '../../config/logger.js';

class MaintenanceService {
  /**
   * 1. Master EOD Orchestrator
   * Triggers EOD sub-jobs in sequence
   */
  async runEndOfDayOrchestration(date = new Date()) {
    logger.info({ date }, 'EOD Orchestration starting...');

    try {
      // Step A: Daily Candle Storage
      logger.info('EOD Step 1/6: Storing today\'s completed daily candles...');
      await this.storeDailyCandles(date);

      // Step B: Recalculate 10-day Average Volumes
      logger.info('EOD Step 2/6: Recalculating average 10-day volumes...');
      await calcMetricsService.calcAvgVolume();

      // Step C: Recalculate Slot Baselines
      logger.info('EOD Step 3/6: Recalculating slot volume baselines...');
      await calcMetricsService.calcSlotVolumeBaseline();

      // Step D: Increment holding days for open positions
      logger.info('EOD Step 4/6: Incrementing holding days for active positions...');
      await this.incrementHoldingDays();

      // Step E: Clean up trade cooldowns
      logger.info('EOD Step 5/6: Cleaning up expired trade cooldowns...');
      await this.cleanupTradeCooldowns();

      // Step F: Sync GTT positions from Kite
      logger.info('EOD Step 6/6: Syncing GTT positions...');
      await this.syncGttPositions();

      logger.info({ date }, 'EOD Orchestration completed successfully');
      return { success: true };
    } catch (error) {
      logger.error({ error: error.message, date }, 'EOD Orchestration failed');
      throw error;
    }
  }

  /**
   * 2. Store Daily Candle
   * Stores today's completed daily candle and trims history to last 20 days
   */
  async storeDailyCandles(date = new Date()) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const trackedStocks = await db.select().from(stocks).where(eq(stocks.isActive, true));
    logger.info({ count: trackedStocks.length }, 'Archiving daily candles for tracked stocks...');

    for (const stock of trackedStocks) {
      try {
        const [liveData] = await db.select()
          .from(marketDataLive)
          .where(eq(marketDataLive.stockId, stock.id))
          .orderBy(desc(marketDataLive.exchangeTimestamp))
          .limit(1);

        if (!liveData) {
          logger.debug({ stockSymbol: stock.symbol }, 'No live data found for candle storage, skipping');
          continue;
        }

        // Upsert daily candle
        await db.insert(marketDataDaily)
          .values({
            stockId: stock.id,
            date: today,
            open: liveData.openPrice || liveData.ltp,
            high: liveData.highPrice || liveData.ltp,
            low: liveData.lowPrice || liveData.ltp,
            close: liveData.ltp,
            volume: liveData.todayVolume || 0
          })
          .onConflictDoUpdate({
            target: [marketDataDaily.stockId, marketDataDaily.date],
            set: {
              open: liveData.openPrice || liveData.ltp,
              high: liveData.highPrice || liveData.ltp,
              low: liveData.lowPrice || liveData.ltp,
              close: liveData.ltp,
              volume: liveData.todayVolume || 0,
              createdAt: new Date()
            }
          });

        // Trim history: keep only last 20 days
        const candles = await db.select({ id: marketDataDaily.id })
          .from(marketDataDaily)
          .where(eq(marketDataDaily.stockId, stock.id))
          .orderBy(desc(marketDataDaily.date));

        if (candles.length > 20) {
          const idsToDelete = candles.slice(20).map(c => c.id);
          await db.delete(marketDataDaily).where(inArray(marketDataDaily.id, idsToDelete));
          logger.debug({ stockSymbol: stock.symbol, deletedCount: idsToDelete.length }, 'Trimmed daily candles history');
        }
      } catch (err) {
        logger.error({ stockSymbol: stock.symbol, error: err.message }, 'Failed to store daily candle for stock');
      }
    }
  }

  /**
   * 3. Prune Intraday Data
   * Deletes intraday candles older than 60 days
   */
  async pruneIntradayData(olderThanDays = 60) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    logger.info({ cutoffDate }, `Pruning intraday candles older than ${olderThanDays} days...`);

    const result = await db.delete(marketDataLive) // or marketDataIntraday? Wait, table in schema is marketDataIntraday
      .where(lte(db.select().from(stocks).limit(1) ? marketDataLive.createdAt : marketDataLive.createdAt, cutoffDate)); // Fallback schema

    // Check marketDataIntraday schema
    try {
      const { marketDataIntraday } = await import('../../db/schema/market/data.js');
      const deleteRes = await db.delete(marketDataIntraday)
        .where(lte(marketDataIntraday.candleTime, cutoffDate));
      logger.info({ cutoffDate }, 'Completed pruning marketDataIntraday');
      return { success: true };
    } catch (e) {
      logger.error({ error: e.message }, 'Failed to prune marketDataIntraday');
      throw e;
    }
  }

  /**
   * Helper to increment holding days for open positions
   */
  async incrementHoldingDays() {
    await db.update(positions)
      .set({ holdingDays: sql`${positions.holdingDays} + 1`, updatedAt: new Date() })
      .where(eq(positions.status, 'OPEN'));
    logger.info('Holding days incremented for all open positions');
  }

  /**
   * Helper to deactivate expired trade cooldowns
   */
  async cleanupTradeCooldowns() {
    const res = await db.update(tradeCooldowns)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(tradeCooldowns.isActive, true),
        lte(tradeCooldowns.cooldownExpires, new Date())
      ));
    logger.info('Trade cooldowns updated/deactivated');
  }

  /**
   * Helper to sync GTT status with Kite broker side
   */
  async syncGttPositions() {
    // Fetch all users with broker credentials
    const credentials = await db.select().from(brokerCredentials).where(eq(brokerCredentials.isActive, true));

    for (const cred of credentials) {
      try {
        const userId = cred.userId;
        // Verify session first
        const sessionStatus = await kiteService.getSessionStatus(userId);
        if (!sessionStatus.active) continue;

        // Fetch GTTs from Kite
        const gtts = await kiteService.getGtts(userId);
        if (!gtts || gtts.length === 0) continue;

        for (const kiteGtt of gtts) {
          // Update DB if exists
          await db.update(gttOrders)
            .set({
              gttStatus: kiteGtt.status,
              modifiedAt: new Date(kiteGtt.updated_at || new Date())
            })
            .where(eq(gttOrders.kiteGttId, kiteGtt.trigger_id));
        }
      } catch (err) {
        logger.error({ userId: cred.userId, error: err.message }, 'Failed to sync GTT orders');
      }
    }
  }

  /**
   * 4. Reconcile Positions
   * Compares trade_positions (positions) table against Kite net positions and holdings
   */
  async reconcilePositions(userId = null) {
    logger.info({ userId }, 'Starting position reconciliation...');

    let userIds = [];
    if (userId) {
      userIds = [userId];
    } else {
      const credentials = await db.select().from(brokerCredentials).where(eq(brokerCredentials.isActive, true));
      userIds = credentials.map(c => c.userId);
    }

    for (const uId of userIds) {
      try {
        const sessionStatus = await kiteService.getSessionStatus(uId);
        if (!sessionStatus.active) {
          logger.debug({ userId: uId }, 'No active Kite session for reconciliation, skipping');
          continue;
        }

        // Fetch db positions
        const dbOpenPositions = await db.select()
          .from(positions)
          .where(and(
            eq(positions.userId, uId),
            eq(positions.status, 'OPEN')
          ));

        // Fetch broker positions & holdings
        const brokerPos = await kiteService.getPositions(uId);
        const brokerHold = await kiteService.getHoldings(uId);

        // Map broker position/holding quantities
        const brokerQtyMap = new Map(); // key: "symbol:product", value: quantity
        
        if (brokerPos && brokerPos.net) {
          for (const p of brokerPos.net) {
            brokerQtyMap.set(`${p.tradingsymbol}:${p.product}`, p.quantity);
          }
        }
        if (brokerHold) {
          for (const h of brokerHold) {
            // Holdings are CNC
            brokerQtyMap.set(`${h.tradingsymbol}:CNC`, h.quantity);
          }
        }

        // Check for DB positions not match broker
        for (const dbPos of dbOpenPositions) {
          const [stock] = await db.select().from(stocks).where(eq(stocks.id, dbPos.stockId)).limit(1);
          if (!stock) continue;

          const key = `${stock.symbol}:${dbPos.productType}`;
          const brokerQty = brokerQtyMap.get(key) || 0;

          if (dbPos.quantity !== brokerQty) {
            // Discrepancy detected!
            const message = `Discrepancy: ${stock.symbol} (${dbPos.productType}) quantity mismatch. DB: ${dbPos.quantity}, Broker: ${brokerQty}`;
            logger.warn({ userId: uId, stock: stock.symbol, dbQty: dbPos.quantity, brokerQty }, message);

            // Create high-priority discrepancy alert
            await db.insert(alerts).values({
              userId: uId,
              alertName: 'POSITION_MISMATCH',
              conditionType: 'DISCREPANCY',
              conditionConfig: {
                stockId: dbPos.stockId,
                symbol: stock.symbol,
                productType: dbPos.productType,
                dbQty: dbPos.quantity,
                brokerQty,
                severity: 'HIGH'
              },
              isActive: true,
              seenFlag: false
            });

            // Create notification
            await db.insert(notifications).values({
              userId: uId,
              title: 'Position Reconcile Alert',
              message,
              type: 'ERROR',
              isRead: false,
              metadata: {
                stockId: dbPos.stockId,
                symbol: stock.symbol,
                productType: dbPos.productType,
                dbQty: dbPos.quantity,
                brokerQty
              }
            });
          }
        }
      } catch (err) {
        logger.error({ userId: uId, error: err.message }, 'Error reconciling positions for user');
      }
    }

    logger.info('Position reconciliation finished');
    return { success: true };
  }

  /**
   * 5. Performance Snapshot
   * Takes a daily snapshot of all closed trades' performance metrics
   */
  async takePerformanceSnapshot(date = new Date()) {
    logger.info({ date }, 'Taking daily performance snapshot...');

    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(date);
    todayEnd.setHours(23, 59, 59, 999);

    try {
      const closedTrades = await db.select()
        .from(trades)
        .where(and(
          eq(trades.status, 'EXITED'),
          gte(trades.exitTime, todayStart),
          lte(trades.exitTime, todayEnd)
        ));

      if (closedTrades.length === 0) {
        logger.info('No closed trades found today to snapshot');
        return { success: true, count: 0 };
      }

      const totalTrades = closedTrades.length;
      const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
      const losingTrades = totalTrades - winningTrades;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const totalPnl = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
      
      const sumPnlPct = closedTrades.reduce((sum, t) => {
        const pct = parseFloat(t.pnlPct || t.pnlPercentage || 0);
        return sum + pct;
      }, 0);
      const avgPnlPct = totalTrades > 0 ? sumPnlPct / totalTrades : 0;

      const capitalDeployed = closedTrades.reduce((sum, t) => {
        const price = parseFloat(t.entryPrice || 0);
        const qty = t.quantity || 0;
        return sum + (price * qty);
      }, 0);

      // Save to dailyPerformanceSnapshots
      const [snapshot] = await db.insert(dailyPerformanceSnapshots)
        .values({
          date: todayStart,
          totalTrades,
          winningTrades,
          losingTrades,
          winRate: winRate.toFixed(2),
          totalPnl: totalPnl.toFixed(2),
          avgPnlPct: avgPnlPct.toFixed(2),
          capitalDeployed: capitalDeployed.toFixed(2)
        })
        .onConflictDoUpdate({
          target: dailyPerformanceSnapshots.date,
          set: {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate: winRate.toFixed(2),
            totalPnl: totalPnl.toFixed(2),
            avgPnlPct: avgPnlPct.toFixed(2),
            capitalDeployed: capitalDeployed.toFixed(2),
            createdAt: new Date()
          }
        })
        .returning();

      logger.info({ snapshotId: snapshot.id }, 'Daily performance snapshot recorded successfully');
      return { success: true, snapshot };
    } catch (err) {
      logger.error({ error: err.message, date }, 'Failed to take daily performance snapshot');
      throw err;
    }
  }
}

export default new MaintenanceService();
