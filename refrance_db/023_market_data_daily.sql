-- File: server/src/db/migrations/023_market_data_daily.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS market_data_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_id UUID NOT NULL,

    trade_date DATE NOT NULL,

    open_price NUMERIC(12,4) NOT NULL,
    high_price NUMERIC(12,4) NOT NULL,
    low_price NUMERIC(12,4) NOT NULL,
    close_price NUMERIC(12,4) NOT NULL,

    volume BIGINT,
    vwap NUMERIC(12,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_market_data_daily_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT unique_daily_candle
        UNIQUE (stock_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_market_data_daily_stock_id ON market_data_daily(stock_id);
CREATE INDEX IF NOT EXISTS idx_market_data_daily_trade_date ON market_data_daily(trade_date DESC);