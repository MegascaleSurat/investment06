-- File: server/src/db/migrations/035_error_logs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    level VARCHAR(20) NOT NULL DEFAULT 'ERROR'
        CHECK (level IN ('ERROR', 'CRITICAL', 'WARNING')),

    service VARCHAR(100) NOT NULL,
    module VARCHAR(100),

    error_code VARCHAR(100),
    message TEXT NOT NULL,
    stack_trace TEXT,

    metadata JSONB,

    trace_id VARCHAR(100),

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs(service);
CREATE INDEX IF NOT EXISTS idx_error_logs_occurred_at ON error_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_metadata_gin ON error_logs USING GIN (metadata);