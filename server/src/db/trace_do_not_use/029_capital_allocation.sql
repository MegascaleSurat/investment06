-- File: server/src/db/migrations/029_capital_allocation.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS capital_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    strategy_id UUID,

    allocation_type VARCHAR(20) NOT NULL
        CHECK (allocation_type IN ('FIXED', 'PERCENTAGE')),

    allocation_value NUMERIC(14,2) NOT NULL,

    max_capital NUMERIC(14,2),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_capital_allocation_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_capital_allocation_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT unique_user_strategy_allocation
        UNIQUE (user_id, strategy_id)
);

CREATE INDEX IF NOT EXISTS idx_capital_allocation_user_id ON capital_allocation(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_allocation_strategy_id ON capital_allocation(strategy_id);
CREATE INDEX IF NOT EXISTS idx_capital_allocation_is_active ON capital_allocation(is_active);
CREATE INDEX IF NOT EXISTS idx_capital_allocation_deleted_at ON capital_allocation(deleted_at);