-- File: server/src/db/migrations/014_trade_logs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trade_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID NOT NULL,

    log_type VARCHAR(30) NOT NULL
        CHECK (log_type IN ('INFO', 'WARNING', 'ERROR', 'STATE_CHANGE', 'ORDER_EVENT', 'SYSTEM')),

    message TEXT NOT NULL,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_trade_logs_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trade_logs_trade_id ON trade_logs(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_logs_log_type ON trade_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_trade_logs_created_at ON trade_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_logs_metadata_gin ON trade_logs USING GIN (metadata);