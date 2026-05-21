import { z } from 'zod';

export const kiteCallbackSchema = z.object({
  body: z.object({
    request_token: z.string({
      required_error: 'Request token is required',
    }).min(1, 'Request token cannot be empty'),
  }),
});

export const kiteSessionSchema = z.object({
  // No specific body validation for session deletion or profile fetch
});
