const dotenv = require("dotenv-safe");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    PORT: z.string().default("5000"),

    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),

    JWT_SECRET: z.string().min(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.format());
    process.exit(1);
}

module.exports = parsed.data;