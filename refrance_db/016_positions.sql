-- File: server/src/db/migrations/016_positions.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    broker_connection_id UUID NOT NULL,
    stock_id UUID NOT NULL,

    product_type VARCHAR(10) NOT NULL
        CHECK (product_type IN ('CNC', 'MIS', 'NRML')),

    quantity INT NOT NULL,
    average_price NUMERIC(12,2) NOT NULL,

    last_traded_price NUMERIC(12,2),

    unrealized_pnl NUMERIC(14,2),
    realized_pnl NUMERIC(14,2),
    pnl_pct NUMERIC(7,2), -- Required by SOP

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'CLOSED')),
    
    position_status VARCHAR(20), -- Required by SOP

    current_target NUMERIC(12,2),
    next_target NUMERIC(12,2),

    holding_days INT DEFAULT 0,

    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    exit_reason TEXT, -- Required by SOP

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_positions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_positions_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE,

    CONSTRAINT fk_positions_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT unique_open_position
        UNIQUE (user_id, broker_connection_id, stock_id, product_type, status)
);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_broker_connection_id ON positions(broker_connection_id);
CREATE INDEX IF NOT EXISTS idx_positions_stock_id ON positions(stock_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_opened_at ON positions(opened_at);