import { z } from 'zod';

export const stateTransitionJobSchema = z.object({
  tradeId: z.string().uuid(),
  toState: z.enum(['NEW', 'ORDER_PLACED', 'PARTIALLY_FILLED', 'ACTIVE', 'TRAILING', 'EXIT_TRIGGERED', 'EXITED', 'CANCELLED']),
  reason: z.string().optional(),
  triggeredBy: z.enum(['SYSTEM', 'USER', 'BROKER']).default('SYSTEM')
});

export const cronJobSchema = z.object({
  triggeredBy: z.string().default('cron'),
  timestamp: z.number().optional()
});
