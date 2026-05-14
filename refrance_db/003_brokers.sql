-- File: server/src/db/migrations/003_brokers.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    supports_live_trading BOOLEAN NOT NULL DEFAULT TRUE,
    supports_paper_trading BOOLEAN NOT NULL DEFAULT TRUE,

    api_base_url TEXT NOT NULL,
    api_version VARCHAR(20),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brokers_status ON brokers(status);
CREATE INDEX IF NOT EXISTS idx_brokers_deleted_at ON brokers(deleted_at);