import { pgTable, uuid, timestamp, numeric, bigint, varchar, boolean, text, integer, index, unique } from 'drizzle-orm/pg-core';
import { stocks, sectors } from './master.js';

export const marketMetrics = pgTable('market_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  marketStatus: varchar('market_status', { length: 20 }).notNull(), // STRONG, WEAK, NEUTRAL
  isTradingAllowed: boolean('is_trading_allowed').default(true),
  remarks: text('remarks'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stockMetrics = pgTable('stock_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  priceChangePct: numeric('price_change_pct', { precision: 7, scale: 2 }),
  avg10dVolume: bigint('avg_10d_volume', { mode: 'number' }),
  volumeRatio: numeric('volume_ratio', { precision: 10, scale: 4 }),
  holdingRangePct: numeric('holding_range_pct', { precision: 7, scale: 2 }),
  stockStatus: varchar('stock_status', { length: 20 }), // TRENDING, STAGNANT
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqStockMetric: unique('unique_stock_metric').on(t.stockId),
  idxSmStockId: index('idx_stock_metrics_stock_id').on(t.stockId),
  idxSmVolumeRatio: index('idx_stock_metrics_volume_ratio').on(t.volumeRatio),
}));

export const sectorMetrics = pgTable('sector_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectorId: uuid('sector_id').references(() => sectors.id, { onDelete: 'cascade' }).notNull(),
  sectorReturnPct: numeric('sector_return_pct', { precision: 7, scale: 2 }),
  breadthPct: numeric('breadth_pct', { precision: 7, scale: 2 }),
  avgVolumeRatio: numeric('avg_volume_ratio', { precision: 10, scale: 4 }),
  outperformancePct: numeric('outperformance_pct', { precision: 7, scale: 2 }),
  sectorStatus: varchar('sector_status', { length: 20 }), // STRONG, WEAK
  rank: integer('rank'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqSectorMetric: unique('unique_sector_metric').on(t.sectorId),
  idxSemSectorId: index('idx_sector_metrics_sector_id').on(t.sectorId),
  idxSemRank: index('idx_sector_metrics_rank').on(t.rank),
}));
