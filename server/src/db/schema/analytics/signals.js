import { pgTable, uuid, text, varchar, timestamp, numeric, bigint, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';
import { stocks } from '../market/master.js';

export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const strategyConfigs = pgTable('strategy_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  configKey: varchar('config_key', { length: 100 }).notNull(),
  configValue: jsonb('config_value').notNull(),
  
  targetMode: varchar('target_mode', { length: 20 }).default('FIXED'), // FIXED/DYNAMIC_TRAIL
  slotRatioThreshold: numeric('slot_ratio_threshold', { precision: 10, scale: 4 }),
  cumRatioThreshold: numeric('cum_ratio_threshold', { precision: 10, scale: 4 }),
  minSignalScore: numeric('min_signal_score', { precision: 5, scale: 2 }),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  unqStrategyConfigKey: unique('unique_strategy_config_key').on(t.strategyId, t.configKey),
}));

export const strategyRules = pgTable('strategy_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  ruleName: varchar('rule_name', { length: 100 }).notNull(),
  ruleCondition: jsonb('rule_condition').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const signals = pgTable('signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  
  signalType: varchar('signal_type', { length: 10 }).notNull(), // ENTRY, EXIT
  direction: varchar('direction', { length: 10 }), // BUY, SELL
  price: numeric('price', { precision: 12, scale: 2 }),
  
  confidence: numeric('confidence', { precision: 5, scale: 2 }),
  signalScore: numeric('signal_score', { precision: 5, scale: 2 }), // Required by SOP
  
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // PENDING, TRIGGERED, CANCELLED, EXPIRED
  signalStatus: varchar('signal_status', { length: 20 }), // Required by SOP
  
  slotRatio: numeric('slot_ratio', { precision: 10, scale: 4 }),
  cumulativeRatio: numeric('cumulative_ratio', { precision: 10, scale: 4 }),
  cumulativeLiveVolume: bigint('cumulative_live_volume', { mode: 'number' }),
  expectedCumulativeVolume: bigint('expected_cumulative_volume', { mode: 'number' }),
  
  metadata: jsonb('metadata'),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxSignalsStrategyId: index('idx_signals_strategy_id').on(t.strategyId),
  idxSignalsStockId: index('idx_signals_stock_id').on(t.stockId),
  idxSignalsStatus: index('idx_signals_status').on(t.status),
}));

export const entrySignals = pgTable('entry_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  signalId: uuid('signal_id').references(() => signals.id, { onDelete: 'cascade' }).notNull(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  
  direction: varchar('direction', { length: 10 }).notNull(),
  entryPrice: numeric('entry_price', { precision: 12, scale: 2 }).notNull(),
  breakoutPrice: numeric('breakout_price', { precision: 12, scale: 2 }),
  confirmationPrice: numeric('confirmation_price', { precision: 12, scale: 2 }),
  
  volumeConfirmed: boolean('volume_confirmed').default(false).notNull(),
  
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // CONFIRMED, TRIGGERED, etc.
  signalStatus: varchar('signal_status', { length: 20 }), // Required by SOP
  signalScore: numeric('signal_score', { precision: 5, scale: 2 }), // Required by SOP
  
  slotRatio: numeric('slot_ratio', { precision: 10, scale: 4 }),
  cumulativeRatio: numeric('cumulative_ratio', { precision: 10, scale: 4 }),
  cumulativeLiveVolume: bigint('cumulative_live_volume', { mode: 'number' }),
  expectedCumulativeVolume: bigint('expected_cumulative_volume', { mode: 'number' }),
  
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqEntrySignalPerSignal: unique('unique_entry_signal_per_signal').on(t.signalId),
}));

export const exitSignals = pgTable('exit_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  signalId: uuid('signal_id').references(() => signals.id, { onDelete: 'cascade' }).notNull(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'cascade' }).notNull(),
  
  exitPrice: numeric('exit_price', { precision: 12, scale: 2 }).notNull(),
  exitReason: text('exit_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
