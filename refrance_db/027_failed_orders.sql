-- File: server/src/db/migrations/027_failed_orders.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS failed_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID,
    trade_order_id UUID,
    broker_connection_id UUID,

    failure_stage VARCHAR(20) NOT NULL
        CHECK (failure_stage IN ('QUEUE', 'PLACEMENT', 'EXECUTION', 'SYNC')),

    error_code VARCHAR(100),
    error_message TEXT NOT NULL,

    retryable BOOLEAN NOT NULL DEFAULT TRUE,
    retry_count INT NOT NULL DEFAULT 0,

    payload JSONB,

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_failed_orders_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL,

    CONSTRAINT fk_failed_orders_order
        FOREIGN KEY (trade_order_id) REFERENCES trade_orders(id) ON DELETE SET NULL,

    CONSTRAINT fk_failed_orders_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_failed_orders_trade_id ON failed_orders(trade_id);
CREATE INDEX IF NOT EXISTS idx_failed_orders_order_id ON failed_orders(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_failed_orders_stage ON failed_orders(failure_stage);
CREATE INDEX IF NOT EXISTS idx_failed_orders_retryable ON failed_orders(retryable);
CREATE INDEX IF NOT EXISTS idx_failed_orders_occurred_at ON failed_orders(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_orders_payload_gin ON failed_orders USING GIN (payload);