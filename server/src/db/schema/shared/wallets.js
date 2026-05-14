import { pgTable, uuid, text, varchar, timestamp, numeric, index } from 'drizzle-orm/pg-core';
import { users } from '../auth/users.js';

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  balance: numeric('balance', { precision: 14, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').references(() => wallets.id, { onDelete: 'cascade' }).notNull(),
  transactionType: varchar('transaction_type', { length: 20 }).notNull(), // DEPOSIT, WITHDRAW, TRADE_DEBIT, TRADE_CREDIT
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // PENDING, COMPLETED, FAILED
  referenceType: varchar('reference_type', { length: 50 }), // e.g. TRADE, MANUAL
  referenceId: uuid('reference_id'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxWalletTxWalletId: index('idx_wallet_transactions_wallet_id').on(t.walletId),
}));
