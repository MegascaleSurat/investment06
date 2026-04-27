const fs = require('node:fs');
const path = require('node:path');

const dotenvSafe = require('dotenv-safe');
const { z } = require('zod');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1),
    PG_POOL_MAX: z.coerce.number().int().positive().default(20),

    REDIS_URL: z.string().min(1),

    JWT_SECRET: z.string().min(20),
    JWT_EXPIRES_IN: z.string().min(1).default('15m'),

    CORS_ORIGIN: z.string().min(1).default('*'),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info')
  })
  .strict();

let cachedEnv;

function loadEnv() {
  if (cachedEnv) return cachedEnv;

  const example = path.resolve(process.cwd(), '.env.example');
  const envPath = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    dotenvSafe.config({
      allowEmptyValues: false,
      example,
      path: envPath
    });
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message
    }));
    const error = new Error('Invalid environment variables');
    error.name = 'EnvValidationError';
    error.issues = issues;
    throw error;
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

module.exports = { loadEnv };
