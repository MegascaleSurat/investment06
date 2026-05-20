import { z } from 'zod';

export const dispatchAlertSchema = z.object({
  userId: z.string().uuid(),
  alertName: z.string(),
  conditionType: z.string(),
  conditionConfig: z.record(z.any()),
});

export const checkHeartbeatsSchema = z.object({
  triggeredBy: z.string().default('cron'),
});

export const reconnectKiteSchema = z.object({
  userId: z.string().uuid(),
  attempt: z.number().int().min(1).default(1),
});

export const writeTradeLogSchema = z.object({
  tradeId: z.string().uuid(),
  logType: z.enum(['INFO', 'ERROR', 'WARNING']),
  message: z.string(),
  metadata: z.string().optional(),
});
