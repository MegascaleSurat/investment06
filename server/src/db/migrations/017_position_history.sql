-- File: server/src/db/migrations/017_position_history.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    position_id UUID NOT NULL,
    trade_id UUID,

    action_type VARCHAR(20) NOT NULL
        CHECK (action_type IN ('OPEN', 'INCREASE', 'DECREASE', 'CLOSE', 'ADJUSTMENT')),

    quantity INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,

    realized_pnl NUMERIC(14,2),
    unrealized_pnl NUMERIC(14,2),

    fees NUMERIC(12,2),
    taxes NUMERIC(12,2),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_position_history_position
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,

    CONSTRAINT fk_position_history_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_position_history_position_id ON position_history(position_id);
CREATE INDEX IF NOT EXISTS idx_position_history_trade_id ON position_history(trade_id);
CREATE INDEX IF NOT EXISTS idx_position_history_action_type ON position_history(action_type);
CREATE INDEX IF NOT EXISTS idx_position_history_created_at ON position_history(created_at);