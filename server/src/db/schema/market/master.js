import { pgTable, uuid, text, varchar, timestamp, boolean, numeric, integer, date, unique, index } from 'drizzle-orm/pg-core';

export const instrumentTypes = pgTable('instrument_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(), // EQUITY, FUTURE, OPTION, INDEX
  description: text('description'),
});

export const sectors = pgTable('sectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stocks = pgTable('stocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  instrumentKey: varchar('instrument_key', { length: 100 }), // Exact name from SOP
  symbol: varchar('symbol', { length: 50 }).notNull(),
  exchange: varchar('exchange', { length: 50 }).notNull().default('NSE'),
  name: varchar('name', { length: 255 }).notNull(),
  instrumentType: varchar('instrument_type', { length: 20 }).notNull().default('EQUITY'),
  segment: varchar('segment', { length: 20 }).notNull().default('CASH'),
  isin: varchar('isin', { length: 20 }),
  lotSize: integer('lot_size').notNull().default(1),
  tickSize: numeric('tick_size', { precision: 10, scale: 4 }),
  sectorId: uuid('sector_id').references(() => sectors.id, { onDelete: 'set null' }),
  subSector: varchar('sub_sector', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  isTradeable: boolean('is_tradeable').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  unqSymbolExchange: unique('unique_symbol_exchange').on(t.symbol, t.exchange),
  idxStocksExchange: index('idx_stocks_exchange').on(t.exchange),
  idxStocksInstrumentType: index('idx_stocks_instrument_type').on(t.instrumentType),
  idxStocksStatus: index('idx_stocks_status').on(t.status),
  idxStocksIsTradeable: index('idx_stocks_is_tradeable').on(t.isTradeable),
  idxStocksDeletedAt: index('idx_stocks_deleted_at').on(t.deletedAt),
}));

export const stockSymbols = pgTable('stock_symbols', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  exchange: varchar('exchange', { length: 50 }).notNull(),
  kiteToken: integer('kite_token'),
  instrumentToken: varchar('instrument_token', { length: 100 }),
  exchangeToken: varchar('exchange_token', { length: 100 }),
  tradingSymbol: varchar('trading_symbol', { length: 100 }),
  upstoxInstrumentKey: text('upstox_instrument_key'),
  expiryDate: date('expiry_date'),
  strikePrice: numeric('strike_price', { precision: 12, scale: 2 }),
  optionType: varchar('option_type', { length: 10 }),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  unqStockSymbol: unique('unique_stock_symbol_exchange').on(t.stockId, t.symbol, t.exchange),
  idxSsKiteToken: index('idx_stock_symbols_kite_token').on(t.kiteToken),
  idxSsInstrumentToken: index('idx_stock_symbols_instrument_token').on(t.instrumentToken),
  idxSsExpiryDate: index('idx_stock_symbols_expiry_date').on(t.expiryDate),
  idxSsDeletedAt: index('idx_stock_symbols_deleted_at').on(t.deletedAt),
}));
