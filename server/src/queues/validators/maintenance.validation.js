import { z } from 'zod';

export const endOfDayOrchestrationSchema = z.object({
  date: z.string().optional().transform(v => v ? new Date(v) : new Date()),
  triggeredBy: z.string().default('SYSTEM'),
});

export const storeDailyCandlesSchema = z.object({
  date: z.string().optional().transform(v => v ? new Date(v) : new Date()),
});

export const pruneIntradayDataSchema = z.object({
  olderThanDays: z.number().int().min(1).default(60),
});

export const reconcilePositionsSchema = z.object({
  userId: z.string().uuid().optional(),
});

export const performanceSnapshotSchema = z.object({
  date: z.string().optional().transform(v => v ? new Date(v) : new Date()),
});
