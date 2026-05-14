import { pgTable, uuid, text, varchar, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';

export const engineState = pgTable('engine_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  engineName: varchar('engine_name', { length: 100 }).notNull().unique(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  heartbeatAt: timestamp('heartbeat_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).default('IDLE'), // RUNNING, IDLE, CRASHED
  isPaused: boolean('is_paused').default(false).notNull(),
  pauseReason: text('pause_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxEngineName: index('idx_engine_state_engine_name').on(t.engineName),
  idxEngineStatus: index('idx_engine_state_status').on(t.status),
}));
