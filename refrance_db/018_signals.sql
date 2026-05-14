-- File: server/src/db/migrations/018_signals.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    strategy_id UUID NOT NULL,
    stock_id UUID NOT NULL,

    signal_type VARCHAR(10) NOT NULL
        CHECK (signal_type IN ('ENTRY', 'EXIT')),

    direction VARCHAR(10)
        CHECK (direction IN ('BUY', 'SELL')),

    price NUMERIC(12,2),

    confidence NUMERIC(5,2),
    signal_score NUMERIC(5,2), -- Required by SOP

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'TRIGGERED', 'CANCELLED', 'EXPIRED')),
    
    signal_status VARCHAR(20), -- Required by SOP

    slot_ratio NUMERIC(10,4),
    cumulative_ratio NUMERIC(10,4),
    cumulative_live_volume BIGINT,
    expected_cumulative_volume BIGINT,

    metadata JSONB,

    triggered_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_signals_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT fk_signals_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signals_strategy_id ON signals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_signals_stock_id ON signals(stock_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_signals_metadata_gin ON signals USING GIN (metadata);