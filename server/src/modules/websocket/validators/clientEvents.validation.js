import { z } from 'zod';

/**
 * Zod Schemas for inbound frontend events (client → server)
 */

// 1. subscribe:stocks
export const subscribeStocksSchema = z.object({
  stockCodes: z.array(z.string().min(1)).min(1, 'At least one stock code is required')
});

// 2. unsubscribe:stocks
export const unsubscribeStocksSchema = z.object({
  stockCodes: z.array(z.string().min(1)).min(1, 'At least one stock code is required')
});

// 3. alerts:mark_seen
export const alertsMarkSeenSchema = z.object({
  alertId: z.string().uuid('Invalid alert ID format')
});
