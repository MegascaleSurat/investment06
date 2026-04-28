-- File: server/src/db/migrations/043_feature_flags.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    rollout_percentage INT NOT NULL DEFAULT 0
        CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

    scope VARCHAR(20) NOT NULL DEFAULT 'GLOBAL'
        CHECK (scope IN ('GLOBAL', 'USER', 'STRATEGY')),

    conditions JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_scope ON feature_flags(scope);
CREATE INDEX IF NOT EXISTS idx_feature_flags_rollout_percentage ON feature_flags(rollout_percentage);
CREATE INDEX IF NOT EXISTS idx_feature_flags_conditions_gin ON feature_flags USING GIN (conditions);