-- File: server/src/db/migrations/052_market_metrics.sql
-- Why needed: calcMarketStatusWorker writes market_status here every 5 min. 
-- This is the master gate — if market_status = WEAK, all new normal entries are blocked.

CREATE TABLE IF NOT EXISTS market_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_status VARCHAR(20) NOT NULL, -- e.g., STRONG, WEAK, NEUTRAL
    is_trading_allowed BOOLEAN DEFAULT TRUE,
    remarks TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: This table usually contains a single row representing the overall market state.
CREATE INDEX IF NOT EXISTS idx_market_metrics_updated_at ON market_metrics(updated_at);
