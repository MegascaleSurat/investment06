-- File: server/src/db/migrations/022_market_data_intraday.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS market_data_intraday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_id UUID NOT NULL,

    interval VARCHAR(10) NOT NULL
        CHECK (interval IN ('1MIN', '3MIN', '5MIN', '15MIN', '30MIN', '60MIN')),

    open_price NUMERIC(12,4) NOT NULL,
    high_price NUMERIC(12,4) NOT NULL,
    low_price NUMERIC(12,4) NOT NULL,
    close_price NUMERIC(12,4) NOT NULL,

    volume BIGINT,
    vwap NUMERIC(12,4),

    candle_start_time TIMESTAMPTZ NOT NULL,
    candle_end_time TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_market_data_intraday_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT unique_intraday_candle
        UNIQUE (stock_id, interval, candle_start_time)
);

CREATE INDEX IF NOT EXISTS idx_market_data_intraday_stock_id ON market_data_intraday(stock_id);
CREATE INDEX IF NOT EXISTS idx_market_data_intraday_interval ON market_data_intraday(interval);
CREATE INDEX IF NOT EXISTS idx_market_data_intraday_candle_time ON market_data_intraday(candle_start_time DESC);