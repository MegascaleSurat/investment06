-- File: server/src/db/migrations/004_broker_connections.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS broker_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    broker_id UUID NOT NULL,

    account_id VARCHAR(100) NOT NULL,
    client_code VARCHAR(100),

    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'ERROR')),

    last_synced_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_broker_connections_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_broker_connections_broker
        FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE,

    CONSTRAINT unique_user_broker_account
        UNIQUE (user_id, broker_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_connections_user_id ON broker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_connections_broker_id ON broker_connections(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_connections_status ON broker_connections(status);
CREATE INDEX IF NOT EXISTS idx_broker_connections_deleted_at ON broker_connections(deleted_at);
CREATE INDEX IF NOT EXISTS idx_broker_connections_token_expires_at ON broker_connections(token_expires_at);