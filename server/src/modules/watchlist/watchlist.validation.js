import { z } from 'zod';

export const addStockSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.string().default('NSE'),
  entryPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  target: z.number().optional(),
  targetMode: z.enum(['PERCENT', 'PRICE']).default('PERCENT'),
});

export const updateStockSchema = z.object({
  entryPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  target: z.number().optional(),
  targetMode: z.enum(['PERCENT', 'PRICE']).optional(),
  status: z.enum(['TRACKING', 'ACTIVE', 'ORDER_PLACED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const uploadWatchlistSchema = z.object({
  filename: z.string().min(1),
  stocks: z.array(addStockSchema),
});
