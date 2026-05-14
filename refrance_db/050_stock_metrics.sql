-- File: server/src/db/migrations/050_stock_metrics.sql
-- Why needed: calcVolumeRatioWorker writes here every 5 min. 
-- trackedStockEngineWorker reads volume_ratio from here for every entry check.

CREATE TABLE IF NOT EXISTS stock_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL, -- FK to stocks
    price_change_pct NUMERIC(7,2),
    avg_10d_volume BIGINT,
    volume_ratio NUMERIC(10,4),
    holding_range_pct NUMERIC(7,2),
    stock_status VARCHAR(20), -- e.g., TRENDING, STAGNANT
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_stock_metrics_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_stock_metric
        UNIQUE (stock_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_metrics_stock_id ON stock_metrics(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_metrics_volume_ratio ON stock_metrics(volume_ratio);
CREATE INDEX IF NOT EXISTS idx_stock_metrics_updated_at ON stock_metrics(updated_at);
