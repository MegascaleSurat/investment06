-- File: server/src/db/migrations/019_entry_signals.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS entry_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    signal_id UUID NOT NULL,
    strategy_id UUID NOT NULL,
    stock_id UUID NOT NULL,

    direction VARCHAR(10) NOT NULL
        CHECK (direction IN ('BUY', 'SELL')),

    entry_price NUMERIC(12,2) NOT NULL,

    breakout_price NUMERIC(12,2),
    confirmation_price NUMERIC(12,2),

    volume_confirmed BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'TRIGGERED', 'EXPIRED')),
    
    signal_status VARCHAR(20), -- Required by SOP
    signal_score NUMERIC(5,2), -- Required by SOP

    slot_ratio NUMERIC(10,4),
    cumulative_ratio NUMERIC(10,4),
    cumulative_live_volume BIGINT,
    expected_cumulative_volume BIGINT,

    confirmed_at TIMESTAMPTZ,
    triggered_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_entry_signals_signal
        FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE,

    CONSTRAINT fk_entry_signals_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT fk_entry_signals_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT unique_entry_signal_per_signal
        UNIQUE (signal_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_signals_strategy_id ON entry_signals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_entry_signals_stock_id ON entry_signals(stock_id);
CREATE INDEX IF NOT EXISTS idx_entry_signals_status ON entry_signals(status);
CREATE INDEX IF NOT EXISTS idx_entry_signals_created_at ON entry_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_entry_signals_metadata_gin ON entry_signals USING GIN (metadata);