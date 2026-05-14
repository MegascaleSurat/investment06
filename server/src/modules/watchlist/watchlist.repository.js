import { db } from '../../db/index.js';
import { watchlists, watchlistItems, watchlistUploads, stocks } from '../../db/schema/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';

class WatchlistRepository {
  // Watchlists
  async findDefaultWatchlistByUserId(userId) {
    const [record] = await db.select().from(watchlists).where(
      and(
        eq(watchlists.userId, userId),
        eq(watchlists.isDefault, true)
      )
    );
    return record;
  }

  async createWatchlist(data) {
    const [record] = await db.insert(watchlists).values(data).returning();
    return record;
  }

  // Watchlist Items
  async getWatchlistItems(watchlistId) {
    return await db.select({
      id: watchlistItems.id,
      stockId: watchlistItems.stockId,
      symbol: stocks.symbol,
      exchange: stocks.exchange,
      name: stocks.name,
      entryPrice: watchlistItems.entryPrice,
      stopLoss: watchlistItems.stopLoss,
      target: watchlistItems.target,
      targetMode: watchlistItems.targetMode,
      status: watchlistItems.status,
      metadata: watchlistItems.metadata,
      createdAt: watchlistItems.createdAt,
      updatedAt: watchlistItems.updatedAt
    })
    .from(watchlistItems)
    .innerJoin(stocks, eq(watchlistItems.stockId, stocks.id))
    .where(eq(watchlistItems.watchlistId, watchlistId))
    .orderBy(desc(watchlistItems.createdAt));
  }

  async addItem(data) {
    const [record] = await db.insert(watchlistItems).values(data).returning();
    return record;
  }

  async updateItem(id, data) {
    const [record] = await db.update(watchlistItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(watchlistItems.id, id))
      .returning();
    return record;
  }

  async findItemByStockAndWatchlist(stockId, watchlistId) {
    const [record] = await db.select().from(watchlistItems).where(
      and(
        eq(watchlistItems.stockId, stockId),
        eq(watchlistItems.watchlistId, watchlistId)
      )
    );
    return record;
  }

  async deleteItem(id) {
    await db.delete(watchlistItems).where(eq(watchlistItems.id, id));
  }

  // Uploads
  async getUploadsByUserId(userId) {
    return await db.select().from(watchlistUploads)
      .where(eq(watchlistUploads.userId, userId))
      .orderBy(desc(watchlistUploads.createdAt));
  }

  async createUpload(data) {
    const [record] = await db.insert(watchlistUploads).values(data).returning();
    return record;
  }
}

export default new WatchlistRepository();
