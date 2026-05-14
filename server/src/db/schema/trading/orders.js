import { pgTable, uuid, text, varchar, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';
import { trades } from './trades.js';
import { stocks } from '../market/master.js';

export const tradeOrders = pgTable('trade_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  brokerOrderId: varchar('broker_order_id', { length: 100 }),
  orderType: varchar('order_type', { length: 20 }).notNull(), // MARKET, LIMIT, SL, SL-M
  transactionType: varchar('transaction_type', { length: 10 }).notNull(), // BUY, SELL
  quantity: integer('quantity').notNull(),
  filledQuantity: integer('filled_quantity').default(0),
  price: numeric('price', { precision: 12, scale: 2 }),
  triggerPrice: numeric('trigger_price', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull(), // PENDING, COMPLETE, CANCELLED, REJECTED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tradeExecutions = pgTable('trade_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => tradeOrders.id, { onDelete: 'cascade' }).notNull(),
  brokerExecutionId: varchar('broker_execution_id', { length: 100 }),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gttOrders = pgTable('gtt_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  kiteGttId: varchar('kite_gtt_id', { length: 100 }).notNull().unique(),
  triggerPrice: numeric('trigger_price', { precision: 12, scale: 2 }).notNull(),
  gttStatus: varchar('gtt_status', { length: 20 }).notNull(), // ACTIVE, TRIGGERED, CANCELLED
  gttType: varchar('gtt_type', { length: 20 }).notNull(), // SINGLE, OCO
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  modifiedAt: timestamp('modified_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxGttTradeId: index('idx_gtt_orders_trade_id').on(t.tradeId),
  idxGttKiteId: index('idx_gtt_orders_kite_gtt_id').on(t.kiteGttId),
}));
