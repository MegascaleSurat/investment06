import { pgTable, uuid, timestamp, numeric, bigint, index, unique } from 'drizzle-orm/pg-core';
import { stocks } from './master.js';

export const marketDataLive = pgTable('market_data_live', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  ltp: numeric('ltp', { precision: 12, scale: 4 }).notNull(),
  bidPrice: numeric('bid_price', { precision: 12, scale: 4 }),
  askPrice: numeric('ask_price', { precision: 12, scale: 4 }),
  bidQuantity: bigint('bid_quantity', { mode: 'number' }),
  askQuantity: bigint('ask_quantity', { mode: 'number' }),
  volume: bigint('volume', { mode: 'number' }),
  todayVolume: bigint('today_volume', { mode: 'number' }),
  averagePrice: numeric('average_price', { precision: 12, scale: 4 }),
  openPrice: numeric('open_price', { precision: 12, scale: 4 }),
  highPrice: numeric('high_price', { precision: 12, scale: 4 }),
  lowPrice: numeric('low_price', { precision: 12, scale: 4 }),
  previousClose: numeric('previous_close', { precision: 12, scale: 4 }),
  prevClose: numeric('prev_close', { precision: 12, scale: 4 }),
  lastTradeTime: timestamp('last_trade_time', { withTimezone: true }),
  exchangeTimestamp: timestamp('exchange_timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxMdLiveStockId: index('idx_market_data_live_stock_id').on(t.stockId),
  idxMdLiveExchangeTime: index('idx_market_data_live_exchange_timestamp').on(t.exchangeTimestamp),
}));

export const marketDataIntraday = pgTable('market_data_intraday', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  candleTime: timestamp('candle_time', { withTimezone: true }).notNull(),
  open: numeric('open', { precision: 12, scale: 4 }).notNull(),
  high: numeric('high', { precision: 12, scale: 4 }).notNull(),
  low: numeric('low', { precision: 12, scale: 4 }).notNull(),
  close: numeric('close', { precision: 12, scale: 4 }).notNull(),
  volume: bigint('volume', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqIntraday: unique('unique_intraday_candle').on(t.stockId, t.candleTime),
  idxMdIntradayTime: index('idx_market_data_intraday_candle_time').on(t.candleTime.desc()),
}));

export const marketDataDaily = pgTable('market_data_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  open: numeric('open', { precision: 12, scale: 4 }).notNull(),
  high: numeric('high', { precision: 12, scale: 4 }).notNull(),
  low: numeric('low', { precision: 12, scale: 4 }).notNull(),
  close: numeric('close', { precision: 12, scale: 4 }).notNull(),
  volume: bigint('volume', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqDaily: unique('unique_daily_candle').on(t.stockId, t.date),
  idxMdDailyDate: index('idx_market_data_daily_date').on(t.date.desc()),
}));

export const volumeData15min = pgTable('volume_data_15min', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  intervalStart: timestamp('interval_start', { withTimezone: true }).notNull(),
  intervalEnd: timestamp('interval_end', { withTimezone: true }).notNull(),
  volume: bigint('volume', { mode: 'number' }).notNull(),
  averageVolume: bigint('average_volume', { mode: 'number' }),
  avgVolume10d: bigint('avg_volume_10d', { mode: 'number' }),
  avgVolume20d: bigint('avg_volume_20d', { mode: 'number' }),
  maxVolume10d: bigint('max_volume_10d', { mode: 'number' }),
  minVolume10d: bigint('min_volume_10d', { mode: 'number' }),
  volumeRatio: numeric('volume_ratio', { precision: 10, scale: 4 }),
  isSpike: bigint('is_spike', { mode: 'number' }).default(0), // Changed to int if needed, boolean in SQL
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqVolumeInterval: unique('unique_volume_interval').on(t.stockId, t.intervalStart),
}));
