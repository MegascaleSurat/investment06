import { pgTable, uuid, text, varchar, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';
import { strategies } from '../analytics/signals.js'; // I'll create this soon
import { stocks } from '../market/master.js';
import { brokerCredentials } from '../auth/brokers.js';

export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'set null' }),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  brokerConnectionId: uuid('broker_connection_id').references(() => brokerCredentials.id, { onDelete: 'cascade' }).notNull(),
  
  tradeType: varchar('trade_type', { length: 10 }).notNull(), // BUY, SELL
  productType: varchar('product_type', { length: 10 }).notNull(), // CNC, MIS, NRML
  quantity: integer('quantity').notNull(),
  entryPrice: numeric('entry_price', { precision: 12, scale: 2 }),
  
  targetPrice: numeric('target_price', { precision: 12, scale: 2 }),
  stopLossPrice: numeric('stop_loss_price', { precision: 12, scale: 2 }),
  currentTarget: numeric('current_target', { precision: 12, scale: 2 }),
  nextTarget: numeric('next_target', { precision: 12, scale: 2 }),
  
  status: varchar('status', { length: 20 }).notNull(), // NEW, ACTIVE, EXITED, etc.
  positionStatus: varchar('position_status', { length: 20 }), // Required by SOP
  
  entryTime: timestamp('entry_time', { withTimezone: true }),
  exitTime: timestamp('exit_time', { withTimezone: true }),
  exitReason: text('exit_reason'),
  
  pnl: numeric('pnl', { precision: 14, scale: 2 }),
  pnlPercentage: numeric('pnl_percentage', { precision: 7, scale: 2 }),
  pnlPct: numeric('pnl_pct', { precision: 7, scale: 2 }), // SOP exact name
  
  holdingDays: integer('holding_days').default(0),
  remarks: text('remarks'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  idxTradesUserId: index('idx_trades_user_id').on(t.userId),
  idxTradesStrategyId: index('idx_trades_strategy_id').on(t.strategyId),
  idxTradesStockId: index('idx_trades_stock_id').on(t.stockId),
  idxTradesStatus: index('idx_trades_status').on(t.status),
}));

export const tradeLogs = pgTable('trade_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  logType: varchar('log_type', { length: 20 }).notNull(), // INFO, ERROR, WARNING
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON string or JSONB if preferred
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tradeStateHistory = pgTable('trade_state_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  fromState: varchar('from_state', { length: 30 }),
  toState: varchar('to_state', { length: 30 }).notNull(),
  reason: text('reason'),
  transitionReason: text('transition_reason'), // SOP name
  triggeredBy: varchar('triggered_by', { length: 20 }), // SYSTEM, USER, BROKER
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  transitionedAt: timestamp('transitioned_at', { withTimezone: true }).defaultNow().notNull(),
});
