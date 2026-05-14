import { relations } from 'drizzle-orm';
import * as schema from '../schema/index.js';

export const usersRelations = relations(schema.users, ({ many }) => ({
  trades: many(schema.trades),
  positions: many(schema.positions),
  wallets: many(schema.wallets),
  brokerCredentials: many(schema.brokerCredentials),
}));

export const stocksRelations = relations(schema.stocks, ({ one, many }) => ({
  sector: one(schema.sectors, {
    fields: [schema.stocks.sectorId],
    references: [schema.sectors.id],
  }),
  metrics: one(schema.stockMetrics, {
    fields: [schema.stocks.id],
    references: [schema.stockMetrics.stockId],
  }),
  trades: many(schema.trades),
  positions: many(schema.positions),
  signals: many(schema.signals),
}));

export const tradesRelations = relations(schema.trades, ({ one, many }) => ({
  user: one(schema.users, {
    fields: [schema.trades.userId],
    references: [schema.users.id],
  }),
  stock: one(schema.stocks, {
    fields: [schema.trades.stockId],
    references: [schema.stocks.id],
  }),
  strategy: one(schema.strategies, {
    fields: [schema.trades.strategyId],
    references: [schema.strategies.id],
  }),
  orders: many(schema.tradeOrders),
  executions: many(schema.tradeExecutions),
  logs: many(schema.tradeLogs),
  stateHistory: many(schema.tradeStateHistory),
}));

export const ordersRelations = relations(schema.tradeOrders, ({ one, many }) => ({
  trade: one(schema.trades, {
    fields: [schema.tradeOrders.tradeId],
    references: [schema.trades.id],
  }),
  executions: many(schema.tradeExecutions),
}));

export const strategyRelations = relations(schema.strategies, ({ many }) => ({
  configs: many(schema.strategyConfigs),
  rules: many(schema.strategyRules),
  signals: many(schema.signals),
  trades: many(schema.trades),
}));
