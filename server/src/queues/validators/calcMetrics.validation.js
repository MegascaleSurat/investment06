import { z } from 'zod';

export const jobParametersSchema = z.object({
  userId: z.string().uuid().optional(),
  stockId: z.string().uuid().optional(),
  triggeredBy: z.string().default('cron'),
  timestamp: z.date().or(z.string().datetime()).optional(),
});
