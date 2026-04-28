-- File: server/src/db/migrations/024_volume_data_15min.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS volume_data_15min (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_id UUID NOT NULL,

    interval_start TIMESTAMPTZ NOT NULL,
    interval_end TIMESTAMPTZ NOT NULL,

    volume BIGINT NOT NULL,

    average_volume BIGINT,
    volume_ratio NUMERIC(10,4),

    is_spike BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_volume_data_15min_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,

    CONSTRAINT unique_volume_interval
        UNIQUE (stock_id, interval_start)
);

CREATE INDEX IF NOT EXISTS idx_volume_data_15min_stock_id ON volume_data_15min(stock_id);
CREATE INDEX IF NOT EXISTS idx_volume_data_15min_interval_start ON volume_data_15min(interval_start DESC);
CREATE INDEX IF NOT EXISTS idx_volume_data_15min_is_spike ON volume_data_15min(is_spike);