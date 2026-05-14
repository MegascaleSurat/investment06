import { z } from 'zod';

export const createStrategySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  config: z.object({
    targetMode: z.enum(['FIXED', 'DYNAMIC_TRAIL']).default('FIXED'),
    slotRatioThreshold: z.number().optional(),
    cumRatioThreshold: z.number().optional(),
    minSignalScore: z.number().optional(),
    configKey: z.string().default('default'),
    configValue: z.record(z.any()).default({}),
  }),
});

export const updateStrategySchema = z.object({
  description: z.string().optional(),
  config: z.object({
    targetMode: z.enum(['FIXED', 'DYNAMIC_TRAIL']).optional(),
    slotRatioThreshold: z.number().optional(),
    cumRatioThreshold: z.number().optional(),
    minSignalScore: z.number().optional(),
    configValue: z.record(z.any()).optional(),
  }).optional(),
});

export const activateVersionSchema = {
  params: z.object({
    strategy_id: z.string().uuid(),
    version_id: z.string().uuid().optional(), // If not provided, activate the latest
  }),
};
