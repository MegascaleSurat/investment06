import { pgTable, uuid, text, varchar, timestamp, numeric, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';
import { brokerCredentials } from '../auth/brokers.js';
import { stocks } from '../market/master.js';

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  brokerConnectionId: uuid('broker_connection_id').references(() => brokerCredentials.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  
  productType: varchar('product_type', { length: 10 }).notNull(), // CNC, MIS, NRML
  quantity: integer('quantity').notNull(),
  averagePrice: numeric('average_price', { precision: 12, scale: 2 }).notNull(),
  lastTradedPrice: numeric('last_traded_price', { precision: 12, scale: 2 }),
  
  unrealizedPnl: numeric('unrealized_pnl', { precision: 14, scale: 2 }),
  realizedPnl: numeric('realized_pnl', { precision: 14, scale: 2 }),
  pnlPct: numeric('pnl_pct', { precision: 7, scale: 2 }), // Required by SOP
  
  status: varchar('status', { length: 20 }).notNull().default('OPEN'), // OPEN, CLOSED
  positionStatus: varchar('position_status', { length: 20 }), // Required by SOP
  
  currentTarget: numeric('current_target', { precision: 12, scale: 2 }),
  nextTarget: numeric('next_target', { precision: 12, scale: 2 }),
  holdingDays: integer('holding_days').default(0),
  
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  exitReason: text('exit_reason'), // Required by SOP
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxPositionsUserId: index('idx_positions_user_id').on(t.userId),
  idxPositionsBrokerId: index('idx_positions_broker_connection_id').on(t.brokerConnectionId),
  idxPositionsStockId: index('idx_positions_stock_id').on(t.stockId),
  unqOpenPosition: unique('unique_open_position').on(t.userId, t.brokerConnectionId, t.stockId, t.productType, t.status),
}));

export const positionHistory = pgTable('position_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  positionId: uuid('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull(),
  averagePrice: numeric('average_price', { precision: 12, scale: 2 }).notNull(),
  pnl: numeric('pnl', { precision: 14, scale: 2 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});
