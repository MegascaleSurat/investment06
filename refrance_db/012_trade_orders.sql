-- File: server/src/db/migrations/012_trade_orders.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trade_orders (
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

    broker_order_id VARCHAR(100),
    exchange_order_id VARCHAR(100),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('CREATED', 'PLACED', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'FAILED')),

    placed_at TIMESTAMPTZ,
    updated_status_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_trade_orders_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,

    CONSTRAINT fk_trade_orders_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE,

    CONSTRAINT unique_broker_order
        UNIQUE (broker_connection_id, broker_order_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_orders_trade_id ON trade_orders(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_orders(status);
CREATE INDEX IF NOT EXISTS idx_trade_orders_placed_at ON trade_orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_trade_orders_deleted_at ON trade_orders(deleted_at);