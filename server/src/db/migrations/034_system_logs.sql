-- File: server/src/db/migrations/034_system_logs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    level VARCHAR(20) NOT NULL
        CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'DEBUG', 'CRITICAL')),

    service VARCHAR(100) NOT NULL,
    module VARCHAR(100),

    message TEXT NOT NULL,

    metadata JSONB,

    trace_id VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata_gin ON system_logs USING GIN (metadata);