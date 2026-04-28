-- File: server/src/db/migrations/026_execution_queue.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS execution_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID NOT NULL,
    trade_order_id UUID NOT NULL,
    broker_connection_id UUID NOT NULL,

    execution_type VARCHAR(20) NOT NULL
        CHECK (execution_type IN ('ORDER_PLACE', 'ORDER_MODIFY', 'ORDER_CANCEL', 'SYNC')),

    priority INT NOT NULL DEFAULT 1,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),

    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,

    next_retry_at TIMESTAMPTZ,

    payload JSONB,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_execution_queue_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,

    CONSTRAINT fk_execution_queue_order
        FOREIGN KEY (trade_order_id) REFERENCES trade_orders(id) ON DELETE CASCADE,

    CONSTRAINT fk_execution_queue_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_execution_queue_status ON execution_queue(status);
CREATE INDEX IF NOT EXISTS idx_execution_queue_priority ON execution_queue(priority);
CREATE INDEX IF NOT EXISTS idx_execution_queue_next_retry_at ON execution_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_execution_queue_trade_id ON execution_queue(trade_id);
CREATE INDEX IF NOT EXISTS idx_execution_queue_order_id ON execution_queue(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_execution_queue_payload_gin ON execution_queue USING GIN (payload);