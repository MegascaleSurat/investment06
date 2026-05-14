-- File: server/src/db/migrations/006_stock_symbols.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stock_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_id UUID NOT NULL,

    broker_id UUID NOT NULL,

    trading_symbol VARCHAR(100) NOT NULL,
    exchange_symbol VARCHAR(100),

    instrument_token VARCHAR(100),
    exchange_token VARCHAR(100),

    expiry_date DATE,
    strike_price NUMERIC(12,2),
    option_type VARCHAR(10)
        CHECK (option_type IN ('CE', 'PE')),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_stock_symbols_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT fk_stock_symbols_broker
        FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,

    CONSTRAINT unique_broker_trading_symbol
        UNIQUE (broker_id, trading_symbol)
);

CREATE INDEX IF NOT EXISTS idx_stock_symbols_stock_id ON stock_symbols(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_broker_id ON stock_symbols(broker_id);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_status ON stock_symbols(status);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_expiry_date ON stock_symbols(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_symbols_deleted_at ON stock_symbols(deleted_at);