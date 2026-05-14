-- File: server/src/db/migrations/041_backtest_trades.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS backtest_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    backtest_run_id UUID NOT NULL,
    strategy_id UUID NOT NULL,
    stock_id UUID NOT NULL,

    trade_type VARCHAR(10) NOT NULL
        CHECK (trade_type IN ('BUY', 'SELL')),

    quantity INT NOT NULL,

    entry_price NUMERIC(12,4) NOT NULL,
    exit_price NUMERIC(12,4),

    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,

    pnl NUMERIC(14,2),
    pnl_percentage NUMERIC(7,2),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_backtest_trades_run
        FOREIGN KEY (backtest_run_id) REFERENCES backtest_runs(id) ON DELETE CASCADE,

    CONSTRAINT fk_backtest_trades_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT fk_backtest_trades_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_run_id ON backtest_trades(backtest_run_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_strategy_id ON backtest_trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_stock_id ON backtest_trades(stock_id);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_status ON backtest_trades(status);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_entry_time ON backtest_trades(entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_created_at ON backtest_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_trades_metadata_gin ON backtest_trades USING GIN (metadata);