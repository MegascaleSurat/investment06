const { z } = require('zod');

const createStockSchema = z
  .object({
    symbol: z.string().min(1).max(32).transform((s) => s.toUpperCase().trim()),
    name: z.string().min(1).max(256).trim(),
    isin: z.string().min(8).max(24).trim().optional(),
    exchange: z.string().min(2).max(16).default('NSE'),
    active: z.boolean().optional()
  })
  .strict();

const getStockBySymbolParamsSchema = z
  .object({
    symbol: z.string().min(1).max(32).transform((s) => s.toUpperCase().trim())
  })
  .strict();

const listStocksQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(500).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    active: z
      .preprocess((v) => (v === undefined ? undefined : v === 'true' || v === true), z.boolean())
      .optional()
  })
  .strict();

module.exports = {
  createStockSchema,
  getStockBySymbolParamsSchema,
  listStocksQuerySchema
};

