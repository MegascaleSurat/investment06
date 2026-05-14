import { db } from '../../db/index.js';
import { stocks, stockSymbols, marketDataDaily, marketDataIntraday } from '../../db/schema/index.js';
import { eq, inArray, and, sql } from 'drizzle-orm';

class InstrumentsRepository {
  /**
   * Bulk update instrument keys and kite tokens
   */
  async updateInstruments(instrumentData) {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const item of instrumentData) {
        // Update stocks table
        await tx.update(stocks)
          .set({
            instrumentKey: item.instrument_token.toString(),
            updatedAt: new Date(),
          })
          .where(and(
            eq(stocks.symbol, item.tradingsymbol),
            eq(stocks.exchange, item.exchange)
          ));

        // Update stock_symbols table if it exists for this stock
        // First find the stock
        const [stock] = await tx.select({ id: stocks.id })
          .from(stocks)
          .where(and(
            eq(stocks.symbol, item.tradingsymbol),
            eq(stocks.exchange, item.exchange)
          ))
          .limit(1);

        if (stock) {
          await tx.insert(stockSymbols)
            .values({
              stockId: stock.id,
              symbol: item.tradingsymbol,
              exchange: item.exchange,
              kiteToken: item.instrument_token,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [stockSymbols.stockId, stockSymbols.symbol, stockSymbols.exchange],
              set: {
                kiteToken: item.instrument_token,
                updatedAt: new Date(),
              },
            });
        }
      }
      return results;
    });
  }

  /**
   * Get stock by instrument token
   */
  async getStockByKiteToken(token) {
    const [result] = await db.select({
      stockId: stocks.id,
      symbol: stocks.symbol,
      exchange: stocks.exchange
    })
    .from(stockSymbols)
    .innerJoin(stocks, eq(stockSymbols.stockId, stocks.id))
    .where(eq(stockSymbols.kiteToken, token))
    .limit(1);
    
    return result;
  }

  /**
   * Save daily historical data
   */
  async saveDailyData(stockId, candles) {
    if (!candles || candles.length === 0) return;

    const values = candles.map(c => ({
      stockId,
      date: new Date(c.date),
      open: c.open.toString(),
      high: c.high.toString(),
      low: c.low.toString(),
      close: c.close.toString(),
      volume: c.volume,
      createdAt: new Date(),
    }));

    return await db.insert(marketDataDaily)
      .values(values)
      .onConflictDoUpdate({
        target: [marketDataDaily.stockId, marketDataDaily.date],
        set: {
          open: sql`EXCLUDED.open`,
          high: sql`EXCLUDED.high`,
          low: sql`EXCLUDED.low`,
          close: sql`EXCLUDED.close`,
          volume: sql`EXCLUDED.volume`,
          createdAt: new Date(),
        },
      });
  }

  /**
   * Save intraday historical data
   */
  async saveIntradayData(stockId, candles) {
    if (!candles || candles.length === 0) return;

    const values = candles.map(c => ({
      stockId,
      candleTime: new Date(c.date),
      open: c.open.toString(),
      high: c.high.toString(),
      low: c.low.toString(),
      close: c.close.toString(),
      volume: c.volume,
      createdAt: new Date(),
    }));

    return await db.insert(marketDataIntraday)
      .values(values)
      .onConflictDoUpdate({
        target: [marketDataIntraday.stockId, marketDataIntraday.candleTime],
        set: {
          open: sql`EXCLUDED.open`,
          high: sql`EXCLUDED.high`,
          low: sql`EXCLUDED.low`,
          close: sql`EXCLUDED.close`,
          volume: sql`EXCLUDED.volume`,
          createdAt: new Date(),
        },
      });
  }
}

export default new InstrumentsRepository();
