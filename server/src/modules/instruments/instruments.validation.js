import { z } from 'zod';

export const getQuoteSchema = {
  params: z.object({
    instruments: z.string().min(1, 'Instruments are required'),
  }),
};

export const getHistoricalSchema = {
  params: z.object({
    instrument_token: z.string().min(1, 'Instrument token is required'),
  }),
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/, 'Invalid from date format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/, 'Invalid to date format (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)'),
    interval: z.enum(['day', 'minute', '3minute', '5minute', '15minute', '30minute', '60minute']),
  }),
};
