-- Base schema (minimal) for sample stock module.
-- In production, use a migrations tool (e.g. sqitch, dbmate) but keep SQL raw.

CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  isin TEXT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks (symbol);

