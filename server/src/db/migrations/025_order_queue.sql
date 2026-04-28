-- File: server/src/db/migrations/025_order_queue.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS order_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID NOT NULL,
    broker_connection_id UUID NOT NULL,

    order_type VARCHAR(20) NOT NULL
        CHECK (order_type IN ('MARKET', 'LIMIT', 'SL', 'SLM')),

    transaction_type VARCHAR(10) NOT NULL
        CHECK (transaction_type IN ('BUY', 'SELL')),

    product_type VARCHAR(10) NOT NULL
        CHECK (product_type IN ('CNC', 'MIS', 'NRML')),

    quantity INT NOT NULL,
    price NUMERIC(12,2),
    trigger_price NUMERIC(12,2),

    priority INT NOT NULL DEFAULT 1,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'PLACED', 'FAILED', 'CANCELLED')),

    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,

    next_retry_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_order_queue_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,

    CONSTRAINT fk_order_queue_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_queue_status ON order_queue(status);
CREATE INDEX IF NOT EXISTS idx_order_queue_priority ON order_queue(priority);
CREATE INDEX IF NOT EXISTS idx_order_queue_next_retry_at ON order_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_order_queue_trade_id ON order_queue(trade_id);