import { z } from 'zod';

export const downloadInstrumentsSchema = z.object({
  exchange: z.string().optional(),
});

export const quoteQuerySchema = z.object({
  instruments: z.string().min(1, 'instruments query param is required'),
});

export const ltpQuerySchema = z.object({
  instruments: z.string().min(1, 'instruments query param is required'),
});

export const ohlcQuerySchema = z.object({
  instruments: z.string().min(1, 'instruments query param is required'),
});

export const historicalQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
  interval: z.enum(['day', '15minute', '3minute', '5minute', '30minute', '60minute']).default('day'),
});
