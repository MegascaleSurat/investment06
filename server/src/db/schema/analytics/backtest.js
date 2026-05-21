import { pgTable, uuid, text, varchar, timestamp, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { strategies } from './signals.js';
import { stocks } from '../market/master.js';

export const backtestRuns = pgTable('backtest_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }),
  parameters: jsonb('parameters').notNull(),
  status: varchar('status', { length: 20 }).default('PENDING'), // RUNNING, COMPLETED, FAILED
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const backtestResults = pgTable('backtest_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  backtestRunId: uuid('backtest_run_id').references(() => backtestRuns.id, { onDelete: 'cascade' }).notNull(),
  metrics: jsonb('metrics').notNull(), // Total trades, win rate, drawdown, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const backtestTrades = pgTable('backtest_trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  backtestRunId: uuid('backtest_run_id').references(() => backtestRuns.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  entryPrice: numeric('entry_price', { precision: 12, scale: 2 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 12, scale: 2 }).notNull(),
  entryTime: timestamp('entry_time', { withTimezone: true }).notNull(),
  exitTime: timestamp('exit_time', { withTimezone: true }).notNull(),
  pnl: numeric('pnl', { precision: 14, scale: 2 }),
  pnlPercentage: numeric('pnl_percentage', { precision: 7, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxBtTradesRunId: index('idx_backtest_trades_run_id').on(t.backtestRunId),
}));
