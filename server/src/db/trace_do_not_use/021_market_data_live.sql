-- File: server/src/db/migrations/021_market_data_live.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS market_data_live (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_id UUID NOT NULL,

    ltp NUMERIC(12,4) NOT NULL,
    bid_price NUMERIC(12,4),
    ask_price NUMERIC(12,4),

    bid_quantity INT,
    ask_quantity INT,

    volume BIGINT,
    average_price NUMERIC(12,4),

    open_price NUMERIC(12,4),
    high_price NUMERIC(12,4),
    low_price NUMERIC(12,4),
    previous_close NUMERIC(12,4),

    last_trade_time TIMESTAMPTZ,
    exchange_timestamp TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_market_data_live_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_market_data_live_stock_id ON market_data_live(stock_id);
CREATE INDEX IF NOT EXISTS idx_market_data_live_exchange_timestamp ON market_data_live(exchange_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_live_last_trade_time ON market_data_live(last_trade_time DESC);