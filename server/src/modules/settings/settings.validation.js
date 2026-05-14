import { z } from 'zod';

export const updateRiskSettingsSchema = z.object({
  capitalPerTrade: z.number().positive(),
  maxLiveTrades: z.number().int().nonnegative(),
  weakMarketQtyPct: z.number().min(0).max(100),
});

export const updateSystemSettingsSchema = z.object({
  engineRefreshInterval: z.number().int().min(1000), // ms
  schedulerEnabled: z.boolean(),
  engineEnabled: z.boolean(),
  cooldownPeriod: z.number().int().nonnegative(), // minutes
});
