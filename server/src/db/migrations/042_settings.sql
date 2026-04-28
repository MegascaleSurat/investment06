-- File: server/src/db/migrations/042_settings.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,

    scope VARCHAR(20) NOT NULL DEFAULT 'SYSTEM'
        CHECK (scope IN ('SYSTEM', 'USER', 'STRATEGY')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT unique_setting_per_scope
        UNIQUE (user_id, key, scope)
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_scope ON settings(scope);
CREATE INDEX IF NOT EXISTS idx_settings_is_active ON settings(is_active);
CREATE INDEX IF NOT EXISTS idx_settings_value_gin ON settings USING GIN (value);