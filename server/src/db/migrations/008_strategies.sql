-- File: server/src/db/migrations/008_strategies.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('MODEL_1', 'MODEL_2')),

    execution_mode VARCHAR(20) NOT NULL DEFAULT 'AUTO'
        CHECK (execution_mode IN ('AUTO', 'MANUAL')),

    capital_allocation_type VARCHAR(20) NOT NULL
        CHECK (capital_allocation_type IN ('FIXED', 'PERCENTAGE')),

    capital_allocation_value NUMERIC(12,2) NOT NULL,

    max_concurrent_trades INT NOT NULL DEFAULT 1,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_strategies_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_type ON strategies(type);
CREATE INDEX IF NOT EXISTS idx_strategies_execution_mode ON strategies(execution_mode);
CREATE INDEX IF NOT EXISTS idx_strategies_status ON strategies(status);
CREATE INDEX IF NOT EXISTS idx_strategies_is_active ON strategies(is_active);
CREATE INDEX IF NOT EXISTS idx_strategies_deleted_at ON strategies(deleted_at);