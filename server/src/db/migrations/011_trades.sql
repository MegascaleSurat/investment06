-- File: server/src/db/migrations/011_trades.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    strategy_id UUID NOT NULL,
    stock_id UUID NOT NULL,
    broker_connection_id UUID NOT NULL,

    trade_type VARCHAR(10) NOT NULL
        CHECK (trade_type IN ('BUY', 'SELL')),

    product_type VARCHAR(10) NOT NULL
        CHECK (product_type IN ('CNC', 'MIS', 'NRML')),

    quantity INT NOT NULL,
    entry_price NUMERIC(12,2),

    target_price NUMERIC(12,2),
    stop_loss_price NUMERIC(12,2),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('NEW', 'WAITING_CONFIRMATION', 'READY', 'ORDER_PLACED', 'ACTIVE', 'PARTIAL_EXIT', 'EXITED', 'CANCELLED', 'FAILED')),

    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,

    pnl NUMERIC(14,2),
    pnl_percentage NUMERIC(7,2),

    remarks TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_trades_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_trades_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,

    CONSTRAINT fk_trades_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT fk_trades_broker_connection
        FOREIGN KEY (broker_connection_id) REFERENCES broker_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_stock_id ON trades(stock_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_exit_time ON trades(exit_time);
CREATE INDEX IF NOT EXISTS idx_trades_deleted_at ON trades(deleted_at);