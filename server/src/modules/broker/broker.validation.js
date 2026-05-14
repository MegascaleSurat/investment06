import { z } from 'zod';

export const saveBrokerCredentialsSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  apiSecret: z.string().min(1, 'API Secret is required'),
  brokerName: z.string().default('ZERODHA'),
});

export const updateBrokerCredentialsSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required').optional(),
  apiSecret: z.string().min(1, 'API Secret is required').optional(),
  brokerName: z.string().default('ZERODHA'),
});
