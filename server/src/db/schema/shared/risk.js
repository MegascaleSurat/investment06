import { pgTable, uuid, text, varchar, timestamp, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';
import { strategies } from '../analytics/signals.js';

export const riskManagementRules = pgTable('risk_management_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }),
  ruleName: varchar('rule_name', { length: 100 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // MAX_DRAWDOWN, MAX_POSITIONS, etc.
  ruleConfig: jsonb('rule_config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const capitalAllocation = pgTable('capital_allocation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'cascade' }).notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 14, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
