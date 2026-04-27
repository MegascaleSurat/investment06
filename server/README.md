# Rule-Based Trading Backend (Base)

Production-grade Node.js backend foundation for a rule-based trading system.

## Quick start

1. Install deps
   - `npm install`
2. Create env file
   - `copy .env.example .env`
3. Start API
   - `npm run dev`
4. Start workers (separate process)
   - `npm run workers`

## Notes

- PostgreSQL access is **raw SQL only** via `pg` connection pool.
- Background processing uses BullMQ + Redis.
- Validation uses Zod end-to-end (env + request validation).
- Logging uses Pino (structured logs) + `pino-http` for request logs.

