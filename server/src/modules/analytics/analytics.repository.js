import { db } from '../../db/index.js';
import { 
  trades, 
  alerts, 
  systemLogs,
  stocks,
  strategies
} from '../../db/schema/index.js';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

class AnalyticsRepository {
  /**
   * Aggregate performance statistics
   */
  async getPerformanceStats(userId) {
    const closedTrades = await db.select({
      pnl: trades.pnl,
      pnlPct: trades.pnlPct,
      status: trades.status
    })
    .from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, 'EXITED')
    ));

    if (closedTrades.length === 0) {
      return { winRate: 0, avgPnl: 0, maxDrawdown: 0, totalTrades: 0 };
    }

    const wins = closedTrades.filter(t => parseFloat(t.pnl) > 0).length;
    const totalPnl = closedTrades.reduce((acc, t) => acc + parseFloat(t.pnl || 0), 0);
    
    // Simple Max Drawdown calculation from PnL percentages
    let maxDd = 0;
    let peak = 0;
    let runningPnl = 0;
    closedTrades.forEach(t => {
      runningPnl += parseFloat(t.pnlPct || 0);
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak - runningPnl;
      if (dd > maxDd) maxDd = dd;
    });

    return {
      totalTrades: closedTrades.length,
      winRate: (wins / closedTrades.length) * 100,
      avgPnl: totalPnl / closedTrades.length,
      maxDrawdown: maxDd
    };
  }

  /**
   * Paginated closed trade history
   */
  async getTradeHistory(userId, { page, limit, startDate, endDate, stockId, strategyId }) {
    const offset = (page - 1) * limit;
    
    let query = db.select({
      id: trades.id,
      symbol: stocks.symbol,
      strategyName: strategies.name,
      entryPrice: trades.entryPrice,
      exitPrice: trades.entryPrice, // Placeholder, usually there's an exitPrice field or executions
      pnl: trades.pnl,
      pnlPct: trades.pnlPct,
      exitReason: trades.exitReason,
      entryTime: trades.entryTime,
      exitTime: trades.exitTime
    })
    .from(trades)
    .innerJoin(stocks, eq(trades.stockId, stocks.id))
    .leftJoin(strategies, eq(trades.strategyId, strategies.id))
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, 'EXITED')
    ));

    if (startDate) query = query.where(gte(trades.exitTime, new Date(startDate)));
    if (endDate) query = query.where(lte(trades.exitTime, new Date(endDate)));
    if (stockId) query = query.where(eq(trades.stockId, stockId));
    if (strategyId) query = query.where(eq(trades.strategyId, strategyId));

    return await query.orderBy(desc(trades.exitTime)).limit(limit).offset(offset);
  }

  /**
   * Fetch unread alerts
   */
  async getUnreadAlerts(userId) {
    return await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.userId, userId),
        eq(alerts.seenFlag, false)
      ))
      .orderBy(desc(alerts.createdAt));
  }

  /**
   * Mark single alert as seen
   */
  async markAlertSeen(alertId, userId) {
    return await db.update(alerts)
      .set({ seenFlag: true, updatedAt: new Date() })
      .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
      .returning();
  }

  /**
   * Mark all alerts as seen
   */
  async markAllAlertsSeen(userId) {
    return await db.update(alerts)
      .set({ seenFlag: true, updatedAt: new Date() })
      .where(and(eq(alerts.userId, userId), eq(alerts.seenFlag, false)))
      .returning();
  }

  /**
   * Fetch system logs
   */
  async getSystemLogs({ page, limit, level, module }) {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(systemLogs);
    
    if (level) query = query.where(eq(systemLogs.level, level));
    if (module) query = query.where(eq(systemLogs.module, module));

    return await query.orderBy(desc(systemLogs.createdAt)).limit(limit).offset(offset);
  }
}

export default new AnalyticsRepository();
