import { pgTable, uuid, text, varchar, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { trades } from './trades.js';
import { tradeOrders } from './orders.js';

export const orderQueue = pgTable('order_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 20 }).notNull(), // PLACE, MODIFY, CANCEL
  priority: integer('priority').default(0),
  status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, PROCESSING, COMPLETED, FAILED
  attempts: integer('attempts').default(0),
  lastError: text('last_error'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const executionQueue = pgTable('execution_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => tradeOrders.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const failedOrders = pgTable('failed_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => tradeOrders.id, { onDelete: 'cascade' }),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});
