import { pgTable, uuid, text, varchar, timestamp, boolean, numeric, jsonb, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';
import { stocks } from './master.js';

export const watchlists = pgTable('watchlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, INACTIVE
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const watchlistItems = pgTable('watchlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  watchlistId: uuid('watchlist_id').references(() => watchlists.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id).notNull(),
  
  entryPrice: numeric('entry_price', { precision: 12, scale: 2 }),
  stopLoss: numeric('stop_loss', { precision: 12, scale: 2 }),
  target1: numeric('target_1', { precision: 12, scale: 2 }), // SOP name
  targetMode: varchar('target_mode', { length: 20 }).default('FIXED'), // FIXED, DYNAMIC
  stepPercent: numeric('step_percent', { precision: 5, scale: 2 }), // SOP name
  
  status: varchar('status', { length: 20 }).default('TRACKING').notNull(), 
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqWatchlistStock: unique('unique_watchlist_symbol').on(t.watchlistId, t.stockId),
  idxWliWatchlistId: index('idx_watchlist_items_watchlist_id').on(t.watchlistId),
}));

export const watchlistUploads = pgTable('watchlist_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), 
  totalStocks: integer('total_stocks').default(0),
  processedCount: integer('processed_count').default(0),
  errorLog: text('error_log'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
