-- File: server/src/db/migrations/009_strategy_configs.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS strategy_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    strategy_id UUID NOT NULL,

    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,

    target_mode VARCHAR(20) DEFAULT 'FIXED', -- FIXED/DYNAMIC_TRAIL
    slot_ratio_threshold NUMERIC(10,4),
    cum_ratio_threshold NUMERIC(10,4),
    min_signal_score NUMERIC(5,2),
    version VARCHAR(20) DEFAULT '1.0.0',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_strategy_configs_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT unique_strategy_config_key
        UNIQUE (strategy_id, config_key)
);

CREATE INDEX IF NOT EXISTS idx_strategy_configs_strategy_id ON strategy_configs(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_configs_is_active ON strategy_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_strategy_configs_deleted_at ON strategy_configs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_strategy_configs_config_value_gin ON strategy_configs USING GIN (config_value);