import { z } from 'zod';

export const eodTriggerSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const engineActionSchema = z.object({
  reason: z.string().optional(),
});
