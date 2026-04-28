-- File: server/src/db/migrations/013_trade_executions.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trade_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trade_id UUID NOT NULL,
    trade_order_id UUID NOT NULL,
    broker_connection_id UUID NOT NULL,

    execution_id VARCHAR(100),

    quantity INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,

    execution_time TIMESTAMPTZ NOT NULL,

    fees NUMERIC(12,2),
    taxes NUMERIC(12,2),

    side VARCHAR(10) NOT NULL
        CHECK (side IN ('BUY', 'SELL')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_trade_executions_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,

    CONSTRAINT fk_trade_executions_order
        FOREIGN KEY (trade_order_id) REFERENCES trade_orders(id) ON DELETE CASCADE,

    CONSTRAINT fk_trade_executions_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE,

    CONSTRAINT unique_execution_per_broker
        UNIQUE (broker_connection_id, execution_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_executions_trade_id ON trade_executions(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_executions_order_id ON trade_executions(trade_order_id);
CREATE INDEX IF NOT EXISTS idx_trade_executions_execution_time ON trade_executions(execution_time);