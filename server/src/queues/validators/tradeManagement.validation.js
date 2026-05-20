import { z } from 'zod';

export const cronJobSchema = z.object({
  triggeredBy: z.string().default('cron'),
  timestamp: z.number().optional()
});

export const partialFillJobSchema = z.object({
  tradeId: z.string().uuid(),
  orderId: z.string().uuid(),
  brokerOrderId: z.string(),
  filledQuantity: z.number().int().positive(),
  fillPrice: z.number().positive(),
  remainingQuantity: z.number().int().nonnegative()
});
