-- File: server/src/db/migrations/038_job_runs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cron_job_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED')),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    duration_ms INT,

    error_message TEXT,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_job_runs_cron_job
        FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_runs_cron_job_id ON job_runs(cron_job_id);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status);
CREATE INDEX IF NOT EXISTS idx_job_runs_started_at ON job_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_created_at ON job_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_metadata_gin ON job_runs USING GIN (metadata);