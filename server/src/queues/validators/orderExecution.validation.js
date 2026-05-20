import { z } from 'zod';

export const buyOrderJobSchema = z.object({
  userId: z.string().uuid(),
  stockId: z.string().uuid(),
  strategyId: z.string().uuid(),
  signalId: z.string().uuid(),
  price: z.number().positive(),
  allocationModifier: z.number().optional()
});

export const stopLossJobSchema = z.object({
  tradeId: z.string().uuid(),
  userId: z.string().uuid(),
  stockId: z.string().uuid(),
  quantity: z.number().int().positive(),
  entryPrice: z.number().positive()
});

export const modifyStopLossJobSchema = z.object({
  tradeId: z.string().uuid(),
  userId: z.string().uuid(),
  stockId: z.string().uuid(),
  newStopLossPrice: z.number().positive()
});

export const sellOrderJobSchema = z.object({
  tradeId: z.string().uuid(),
  userId: z.string().uuid(),
  stockId: z.string().uuid(),
  exitReason: z.string().default('Exit condition met')
});

export const orderPollerJobSchema = z.object({
  triggeredBy: z.string().default('cron')
});
