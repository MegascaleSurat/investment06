import { pgTable, uuid, text, varchar, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // INFO, SUCCESS, WARNING, ERROR
  isRead: boolean('is_read').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxNotifUserId: index('idx_notifications_user_id').on(t.userId),
  idxNotifIsRead: index('idx_notifications_is_read').on(t.isRead),
}));

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  alertName: varchar('alert_name', { length: 100 }).notNull(),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionConfig: jsonb('condition_config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
