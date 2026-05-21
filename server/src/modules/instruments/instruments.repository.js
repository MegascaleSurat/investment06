import { db } from '../../db/index.js';
import { stocks, stockSymbols, marketDataDaily, marketDataIntraday } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

class InstrumentsRepository {
  async findStockBySymbolExchange(symbol, exchange) {
    const [stock] = await db.select()
      .from(stocks)
      .where(and(eq(stocks.symbol, symbol), eq(stocks.exchange, exchange)))
      .limit(1);
    return stock;
  }

  async findStockByInstrumentKey(instrumentKey) {
    const [stock] = await db.select()
      .from(stocks)
      .where(eq(stocks.instrumentKey, instrumentKey))
      .limit(1);
    return stock;
  }

  async upsertStock(data) {
    const [stock] = await db.insert(stocks)
      .values({
        instrumentKey: data.instrumentKey,
        symbol: data.symbol,
        exchange: data.exchange,
        name: data.name,
        instrumentType: data.instrumentType,
        segment: data.segment,
        isin: data.isin,
        lotSize: data.lotSize,
        tickSize: data.tickSize,
        status: 'ACTIVE',
        isTradeable: true,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [stocks.symbol, stocks.exchange],
        set: {
          instrumentKey: data.instrumentKey,
          name: data.name,
          instrumentType: data.instrumentType,
          segment: data.segment,
          isin: data.isin,
          lotSize: data.lotSize,
          tickSize: data.tickSize,
          updatedAt: new Date(),
        },
      })
      .returning();
    return stock;
  }

  async upsertStockSymbol(stockId, data) {
    const [symbol] = await db.insert(stockSymbols)
      .values({
        stockId,
        symbol: data.tradingSymbol,
        exchange: data.exchange,
        kiteToken: data.kiteToken,
        instrumentToken: String(data.instrumentToken),
        exchangeToken: String(data.exchangeToken),
        tradingSymbol: data.tradingSymbol,
        expiryDate: data.expiry || null,
        strikePrice: data.strikePrice || null,
        optionType: data.optionType || null,
        status: 'ACTIVE',
      })
      .onConflictDoUpdate({
        target: [stockSymbols.stockId, stockSymbols.symbol, stockSymbols.exchange],
        set: {
          kiteToken: data.kiteToken,
          instrumentToken: String(data.instrumentToken),
          exchangeToken: String(data.exchangeToken),
          tradingSymbol: data.tradingSymbol,
          expiryDate: data.expiry || null,
          strikePrice: data.strikePrice || null,
          optionType: data.optionType || null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return symbol;
  }

  async findStockSymbolByKiteToken(kiteToken) {
    const [symbol] = await db.select()
      .from(stockSymbols)
      .where(eq(stockSymbols.kiteToken, kiteToken))
      .limit(1);
    return symbol;
  }

  async bulkInsertDailyData(records) {
    if (records.length === 0) return [];
    return await db.insert(marketDataDaily)
      .values(records)
      .onConflictDoNothing({
        target: [marketDataDaily.stockId, marketDataDaily.date],
      })
      .returning();
  }

  async bulkInsertIntradayData(records) {
    if (records.length === 0) return [];
    return await db.insert(marketDataIntraday)
      .values(records)
      .onConflictDoNothing({
        target: [marketDataIntraday.stockId, marketDataIntraday.candleTime],
      })
      .returning();
  }

}

export default new InstrumentsRepository();
