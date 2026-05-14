import { db } from '../../db/index.js';
import { 
  trades, 
  tradeOrders, 
  tradeLogs, 
  stocks, 
  strategies,
  orderQueue
} from '../../db/schema/index.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

class TradeRepository {
  /**
   * List all trades with pagination
   */
  async getTrades(userId, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    
    let query = db.select({
      id: trades.id,
      symbol: stocks.symbol,
      strategyName: strategies.name,
      tradeType: trades.tradeType,
      quantity: trades.quantity,
      entryPrice: trades.entryPrice,
      pnlPct: trades.pnlPct,
      status: trades.status,
      entryTime: trades.entryTime,
      createdAt: trades.createdAt
    })
    .from(trades)
    .innerJoin(stocks, eq(trades.stockId, stocks.id))
    .leftJoin(strategies, eq(trades.strategyId, strategies.id))
    .where(eq(trades.userId, userId));

    if (status) {
      query = query.where(eq(trades.status, status));
    }

    return await query.orderBy(desc(trades.createdAt)).limit(limit).offset(offset);
  }

  /**
   * Get active/trailing positions
   */
  async getActiveTrades(userId) {
    return await db.select({
      id: trades.id,
      symbol: stocks.symbol,
      quantity: trades.quantity,
      entryPrice: trades.entryPrice,
      stopLossPrice: trades.stopLossPrice,
      targetPrice: trades.targetPrice,
      pnlPct: trades.pnlPct,
      status: trades.status,
      entryTime: trades.entryTime
    })
    .from(trades)
    .innerJoin(stocks, eq(trades.stockId, stocks.id))
    .where(and(
      eq(trades.userId, userId),
      inArray(trades.status, ['ACTIVE', 'TRAILING', 'CONFIRMED'])
    ))
    .orderBy(desc(trades.entryTime));
  }

  /**
   * Get full trade details
   */
  async getTradeById(id, userId) {
    const [record] = await db.select()
      .from(trades)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)));
    return record;
  }

  /**
   * Get orders for a specific trade
   */
  async getOrdersByTradeId(tradeId) {
    return await db.select()
      .from(tradeOrders)
      .where(eq(tradeOrders.tradeId, tradeId))
      .orderBy(desc(tradeOrders.createdAt));
  }

  /**
   * Get logs for a specific trade
   */
  async getLogsByTradeId(tradeId) {
    return await db.select()
      .from(tradeLogs)
      .where(eq(tradeLogs.tradeId, tradeId))
      .orderBy(desc(tradeLogs.createdAt));
  }

  /**
   * List all orders with pagination
   */
  async getAllOrders(userId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    return await db.select({
      id: tradeOrders.id,
      tradeId: tradeOrders.tradeId,
      symbol: stocks.symbol,
      brokerOrderId: tradeOrders.brokerOrderId,
      orderType: tradeOrders.orderType,
      transactionType: tradeOrders.transactionType,
      quantity: tradeOrders.quantity,
      price: tradeOrders.price,
      status: tradeOrders.status,
      createdAt: tradeOrders.createdAt
    })
    .from(tradeOrders)
    .innerJoin(trades, eq(tradeOrders.tradeId, trades.id))
    .innerJoin(stocks, eq(trades.stockId, stocks.id))
    .where(eq(trades.userId, userId))
    .orderBy(desc(tradeOrders.createdAt))
    .limit(limit)
    .offset(offset);
  }

  /**
   * Update trade status
   */
  async updateTradeStatus(id, status, remarks) {
    return await db.update(trades)
      .set({ status, remarks, updatedAt: new Date() })
      .where(eq(trades.id, id))
      .returning();
  }

  /**
   * Add to order queue
   */
  async queueOrder(data) {
    return await db.insert(orderQueue).values(data).returning();
  }

  /**
   * Add trade log
   */
  async addLog(data) {
    return await db.insert(tradeLogs).values(data).returning();
  }

  /**
   * Check for duplicate active positions
   */
  async hasActivePosition(userId, stockId) {
    const [record] = await db.select({ id: trades.id })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        eq(trades.stockId, stockId),
        inArray(trades.status, ['ORDER_PLACED', 'ACTIVE', 'TRAILING', 'CONFIRMED'])
      ))
      .limit(1);
    return !!record;
  }

  /**
   * Get cooldown status
   */
  async getCooldownStatus(userId, stockId) {
    const [record] = await db.select({ 
      exitTime: trades.exitTime 
    })
    .from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.stockId, stockId),
      eq(trades.status, 'EXITED')
    ))
    .orderBy(desc(trades.exitTime))
    .limit(1);

    return record;
  }

  /**
   * Force update trade state
   */
  async forceUpdateState(tradeId, userId, status, remarks) {
    return await db.update(trades)
      .set({ status, remarks, updatedAt: new Date() })
      .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
      .returning();
  }

  /**
   * Get stock by code
   */
  async getStockByCode(code) {
    const [record] = await db.select().from(stocks).where(eq(stocks.symbol, code));
    return record;
  }
}

export default new TradeRepository();
