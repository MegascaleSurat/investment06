-- File: server/src/db/migrations/037_cron_jobs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cron_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,

    schedule VARCHAR(100) NOT NULL, -- cron expression

    job_type VARCHAR(30) NOT NULL
        CHECK (job_type IN ('SYSTEM', 'STRATEGY', 'SYNC', 'MAINTENANCE')),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED')),

    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    is_running BOOLEAN NOT NULL DEFAULT FALSE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_cron_job_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_status ON cron_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run_at ON cron_jobs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_is_running ON cron_jobs(is_running);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_metadata_gin ON cron_jobs USING GIN (metadata);