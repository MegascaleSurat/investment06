-- File: server/src/db/migrations/020_exit_signals.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS exit_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    signal_id UUID NOT NULL,
    strategy_id UUID NOT NULL,
    stock_id UUID NOT NULL,
    trade_id UUID,

    exit_type VARCHAR(20) NOT NULL
        CHECK (exit_type IN ('TARGET', 'STOP_LOSS', 'TRAILING', 'TIME_EXIT', 'MANUAL')),

    exit_price NUMERIC(12,2),

    trailing_price NUMERIC(12,2),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'TRIGGERED', 'CANCELLED', 'EXPIRED')),

    triggered_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_exit_signals_signal
        FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE CASCADE,

    CONSTRAINT fk_exit_signals_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT fk_exit_signals_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT fk_exit_signals_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL,

    CONSTRAINT unique_exit_signal_per_signal
        UNIQUE (signal_id)
);

CREATE INDEX IF NOT EXISTS idx_exit_signals_strategy_id ON exit_signals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_exit_signals_stock_id ON exit_signals(stock_id);
CREATE INDEX IF NOT EXISTS idx_exit_signals_trade_id ON exit_signals(trade_id);
CREATE INDEX IF NOT EXISTS idx_exit_signals_status ON exit_signals(status);
CREATE INDEX IF NOT EXISTS idx_exit_signals_created_at ON exit_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_exit_signals_metadata_gin ON exit_signals USING GIN (metadata);