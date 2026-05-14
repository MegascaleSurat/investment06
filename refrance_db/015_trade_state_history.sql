-- File: server/src/db/migrations/015_trade_state_history.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trade_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID NOT NULL,

    from_state VARCHAR(30),
    to_state VARCHAR(30) NOT NULL
        CHECK (to_state IN (
            'NEW',
            'WAITING_CONFIRMATION',
            'READY',
            'ORDER_PLACED',
            'ACTIVE',
            'PARTIAL_EXIT',
            'EXITED',
            'CANCELLED',
            'FAILED'
        )),

    reason TEXT,
    transition_reason TEXT, -- Exact name from SOP

    triggered_by VARCHAR(20)
        CHECK (triggered_by IN ('SYSTEM', 'USER', 'BROKER')),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Exact name from SOP

    CONSTRAINT fk_trade_state_history_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trade_state_history_trade_id ON trade_state_history(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_state_history_to_state ON trade_state_history(to_state);
CREATE INDEX IF NOT EXISTS idx_trade_state_history_created_at ON trade_state_history(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_state_history_metadata_gin ON trade_state_history USING GIN (metadata);