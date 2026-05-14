import { pgTable, uuid, text, varchar, timestamp, numeric, boolean, unique, index } from 'drizzle-orm/pg-core';
import { stocks } from '../market/master.js';
import { users } from '../auth/users.js';
import { trades } from './trades.js';

export const confirmationTimers = pgTable('confirmation_timers', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  timerStartedAt: timestamp('timer_started_at', { withTimezone: true }).defaultNow().notNull(),
  timerExpiresAt: timestamp('timer_expires_at', { withTimezone: true }).notNull(),
  timerStatus: varchar('timer_status', { length: 20 }).default('ACTIVE'), // ACTIVE, EXPIRED, CANCELLED, TRIGGERED
  
  entryPriceAtStart: numeric('entry_price_at_start', { precision: 12, scale: 2 }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqActiveConfirmationTimer: unique('unique_active_confirmation_timer').on(t.stockId, t.userId, t.timerStatus),
  idxCtStockUser: index('idx_confirmation_timers_stock_user').on(t.stockId, t.userId),
}));

export const tradeCooldowns = pgTable('trade_cooldowns', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'set null' }),
  
  cooldownStart: timestamp('cooldown_start', { withTimezone: true }).defaultNow().notNull(),
  cooldownExpires: timestamp('cooldown_expires', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxTcdStockUser: index('idx_trade_cooldowns_stock_user').on(t.stockId, t.userId),
}));
