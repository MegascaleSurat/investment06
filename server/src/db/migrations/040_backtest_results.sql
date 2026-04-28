-- File: server/src/db/migrations/040_backtest_results.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    backtest_run_id UUID NOT NULL,

    total_trades INT NOT NULL,
    winning_trades INT NOT NULL,
    losing_trades INT NOT NULL,

    total_profit NUMERIC(16,2),
    total_loss NUMERIC(16,2),
    net_profit NUMERIC(16,2),

    win_rate NUMERIC(5,2),

    max_drawdown NUMERIC(16,2),
    max_drawdown_percentage NUMERIC(7,2),

    average_profit NUMERIC(16,2),
    average_loss NUMERIC(16,2),

    profit_factor NUMERIC(10,4),

    sharpe_ratio NUMERIC(10,4),

    expectancy NUMERIC(10,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_backtest_results_run
        FOREIGN KEY (backtest_run_id) REFERENCES backtest_runs(id) ON DELETE CASCADE,

    CONSTRAINT unique_backtest_result_per_run
        UNIQUE (backtest_run_id)
);

CREATE INDEX IF NOT EXISTS idx_backtest_results_run_id ON backtest_results(backtest_run_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_created_at ON backtest_results(created_at DESC);