import { pgTable, uuid, text, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';

export const systemLogs = pgTable('system_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  level: varchar('level', { length: 20 }).notNull(), // INFO, WARN, ERROR
  module: varchar('module', { length: 50 }),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  errorCode: varchar('error_code', { length: 50 }),
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),
  context: jsonb('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }), // e.g. TRADE, USER, STRATEGY
  entityId: uuid('entity_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxAuditUserId: index('idx_audit_logs_user_id').on(t.userId),
  idxAuditAction: index('idx_audit_logs_action').on(t.action),
}));
