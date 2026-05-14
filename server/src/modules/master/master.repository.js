import { db } from '../../db/index.js';
import { sectors, stocks } from '../../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

class MasterRepository {
  // Sectors
  async getAllSectors() {
    return await db.select().from(sectors).orderBy(sectors.name);
  }

  async findSectorById(id) {
    const [record] = await db.select().from(sectors).where(eq(sectors.id, id));
    return record;
  }

  async findSectorByName(name) {
    const [record] = await db.select().from(sectors).where(eq(sectors.name, name));
    return record;
  }

  async createSector(data) {
    const [record] = await db.insert(sectors).values(data).returning();
    return record;
  }

  async updateSector(id, data) {
    const [record] = await db.update(sectors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sectors.id, id))
      .returning();
    return record;
  }

  // Stocks
  async getAllStocks() {
    return await db.select({
      id: stocks.id,
      symbol: stocks.symbol,
      exchange: stocks.exchange,
      name: stocks.name,
      instrumentKey: stocks.instrumentKey,
      instrumentType: stocks.instrumentType,
      segment: stocks.segment,
      status: stocks.status,
      isTradeable: stocks.isTradeable,
      sectorId: stocks.sectorId,
      sectorName: sectors.name,
      createdAt: stocks.createdAt,
      updatedAt: stocks.updatedAt
    })
    .from(stocks)
    .leftJoin(sectors, eq(stocks.sectorId, sectors.id))
    .where(sql`${stocks.deletedAt} IS NULL`)
    .orderBy(stocks.symbol);
  }

  async findStockByCode(symbol, exchange = 'NSE') {
    const [record] = await db.select().from(stocks).where(
      and(
        eq(stocks.symbol, symbol),
        eq(stocks.exchange, exchange)
      )
    );
    return record;
  }

  async createStock(data) {
    const [record] = await db.insert(stocks).values(data).returning();
    return record;
  }

  async updateStock(symbol, exchange, data) {
    const [record] = await db.update(stocks)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(stocks.symbol, symbol),
          eq(stocks.exchange, exchange)
        )
      )
      .returning();
    return record;
  }

  async bulkUpsertStocks(stocksList) {
    return await db.insert(stocks)
      .values(stocksList)
      .onConflictDoUpdate({
        target: [stocks.symbol, stocks.exchange],
        set: {
          name: sql`EXCLUDED.name`,
          sectorId: sql`EXCLUDED.sector_id`,
          instrumentKey: sql`EXCLUDED.instrument_key`,
          instrumentType: sql`EXCLUDED.instrument_type`,
          segment: sql`EXCLUDED.segment`,
          isin: sql`EXCLUDED.isin`,
          lotSize: sql`EXCLUDED.lot_size`,
          tickSize: sql`EXCLUDED.tick_size`,
          status: sql`EXCLUDED.status`,
          isTradeable: sql`EXCLUDED.is_tradeable`,
          updatedAt: new Date(),
          deletedAt: null
        }
      })
      .returning();
  }
}

export default new MasterRepository();
