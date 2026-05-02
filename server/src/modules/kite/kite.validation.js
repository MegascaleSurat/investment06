const { z } = require('zod');

const upsertCredentialsSchema = z.object({
  apiKey: z.string().min(1).max(200),
  apiSecret: z.string().min(1).max(500)
});

module.exports = { upsertCredentialsSchema };

