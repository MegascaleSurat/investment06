-- File: server/src/db/migrations/051_sector_metrics.sql
-- Why needed: calcSectorMetricsWorker writes here every 5 min. 
-- Sector Dashboard API reads from here. 
-- trackedStockEngineWorker checks sector_status before every buy.

CREATE TABLE IF NOT EXISTS sector_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID NOT NULL, -- FK to sectors
    sector_return_pct NUMERIC(7,2),
    breadth_pct NUMERIC(7,2),
    avg_volume_ratio NUMERIC(10,4),
    outperformance_pct NUMERIC(7,2),
    sector_status VARCHAR(20), -- e.g., STRONG, WEAK
    rank INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sector_metrics_sector
        FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE,

    CONSTRAINT unique_sector_metric
        UNIQUE (sector_id)
);

CREATE INDEX IF NOT EXISTS idx_sector_metrics_sector_id ON sector_metrics(sector_id);
CREATE INDEX IF NOT EXISTS idx_sector_metrics_rank ON sector_metrics(rank);
CREATE INDEX IF NOT EXISTS idx_sector_metrics_updated_at ON sector_metrics(updated_at);
