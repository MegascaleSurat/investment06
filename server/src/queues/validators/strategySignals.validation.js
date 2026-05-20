import { z } from 'zod';

export const strategyJobDataSchema = z.object({
  triggeredBy: z.string().default('cron'),
  userId: z.string().uuid().optional(),
  stockId: z.string().uuid().optional(),
  timestamp: z.date().or(z.string().datetime()).optional(),
  strategyId: z.string().uuid().optional()
});
