import { z } from 'zod';

export const getStockMetricsSchema = {
  params: z.object({
    stock_code: z.string().min(1, 'Stock code is required'),
  }),
};
