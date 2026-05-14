import { z } from 'zod';

export const getHistoricalSchema = {
  params: z.object({
    stock_code: z.string().min(1, 'Stock code is required'),
  }),
};

export const getIntradayCandlesSchema = {
  params: z.object({
    stock_code: z.string().min(1, 'Stock code is required'),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  }),
};

export const getVolumeBaselineSchema = {
  params: z.object({
    stock_code: z.string().min(1, 'Stock code is required'),
  }),
};
