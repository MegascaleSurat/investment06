import { z } from 'zod';

export const placeOrderSchema = z.object({
  symbol: z.string().min(1),
  transaction_type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']),
  product: z.enum(['CNC', 'MIS', 'NRML']).default('MIS'),
  price: z.number().optional(),
  trigger_price: z.number().optional(),
  exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']).default('NSE'),
});

export const modifyOrderSchema = z.object({
  quantity: z.number().int().positive().optional(),
  price: z.number().optional(),
  trigger_price: z.number().optional(),
  order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']).optional(),
});

export const placeGttSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']).default('NSE'),
  transaction_type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  trigger_price: z.number().positive(),
  price: z.number().positive(),
  condition_type: z.enum(['single', 'two-leg']).default('single'),
});

export const modifyGttSchema = z.object({
  trigger_price: z.number().positive().optional(),
  price: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
});

export const getOrderHistorySchema = z.object({
  days: z.string().optional().transform(v => parseInt(v) || 7),
});

export const marginCalcSchema = z.array(z.object({
  tradingsymbol: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']).default('NSE'),
  transaction_type: z.enum(['BUY', 'SELL']),
  order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']),
  quantity: z.number().int().positive(),
  product: z.enum(['CNC', 'MIS', 'NRML']).default('MIS'),
  price: z.number().optional(),
  trigger_price: z.number().optional(),
}));

export const basketOrderSchema = z.array(z.object({
  symbol: z.string().min(1),
  transaction_type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  order_type: z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']),
  product: z.enum(['CNC', 'MIS', 'NRML']).default('MIS'),
  price: z.number().optional(),
  trigger_price: z.number().optional(),
  exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']).default('NSE'),
}));

export const slVerifySchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['NSE', 'BSE', 'NFO', 'MCX']).default('NSE'),
  trigger_price: z.number().positive(),
  transaction_type: z.enum(['BUY', 'SELL']),
});
