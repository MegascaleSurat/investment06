import { z } from 'zod';

export const getHistorySchema = {
  query: z.object({
    page: z.string().optional().transform(v => parseInt(v) || 1),
    limit: z.string().optional().transform(v => parseInt(v) || 20),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    stockId: z.string().uuid().optional(),
    strategyId: z.string().uuid().optional(),
  }),
};

export const alertIdParamSchema = {
  params: z.object({
    alert_id: z.string().uuid(),
  }),
};

export const getLogsSchema = {
  query: z.object({
    page: z.string().optional().transform(v => parseInt(v) || 1),
    limit: z.string().optional().transform(v => parseInt(v) || 50),
    level: z.string().optional(),
    module: z.string().optional(),
  }),
};
