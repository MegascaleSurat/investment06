import { z } from 'zod';

export const getTradesSchema = {
  query: z.object({
    page: z.string().optional().transform(v => parseInt(v) || 1),
    limit: z.string().optional().transform(v => parseInt(v) || 20),
    status: z.string().optional(),
  }),
};

export const tradeIdParamSchema = {
  params: z.object({
    trade_id: z.string().uuid(),
  }),
};

export const stockCodeParamSchema = {
  params: z.object({
    stock_code: z.string().min(1),
  }),
};

export const forceStateSchema = {
  params: z.object({
    trade_id: z.string().uuid(),
  }),
  body: z.object({
    state: z.string().min(1),
    reason: z.string().optional(),
  }),
};

export const getOrdersSchema = {
  query: z.object({
    page: z.string().optional().transform(v => parseInt(v) || 1),
    limit: z.string().optional().transform(v => parseInt(v) || 50),
  }),
};
