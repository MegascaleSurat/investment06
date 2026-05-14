import { z } from 'zod';

export const createSectorSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateSectorSchema = {
  params: z.object({
    sector_id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createStockSchema = z.object({
  symbol: z.string().min(1).max(50),
  exchange: z.string().default('NSE'),
  name: z.string().min(1).max(255),
  sectorId: z.string().uuid().optional().nullable(),
  instrumentKey: z.string().optional(),
  instrumentType: z.enum(['EQUITY', 'FUTURE', 'OPTION', 'INDEX']).default('EQUITY'),
  segment: z.enum(['CASH', 'FNO']).default('CASH'),
  isin: z.string().max(20).optional(),
  lotSize: z.number().int().positive().default(1),
  tickSize: z.string().optional(), // numeric as string for precision
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isTradeable: z.boolean().default(true),
});

export const updateStockSchema = {
  params: z.object({
    stock_code: z.string().min(1),
  }),
  body: createStockSchema.partial().omit({ symbol: true, exchange: true }),
};

export const bulkImportStocksSchema = z.array(createStockSchema);
