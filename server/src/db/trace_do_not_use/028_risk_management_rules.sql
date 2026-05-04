-- File: server/src/db/migrations/028_risk_management_rules.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS risk_management_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,
    strategy_id UUID,

    rule_type VARCHAR(30) NOT NULL
        CHECK (rule_type IN (
            'MAX_DAILY_LOSS',
            'MAX_TRADE_LOSS',
            'MAX_POSITION_SIZE',
            'MAX_CONCURRENT_TRADES',
            'CAPITAL_LIMIT',
            'DRAWDOWN_LIMIT'
        )),

    value_type VARCHAR(20) NOT NULL
        CHECK (value_type IN ('PERCENTAGE', 'ABSOLUTE', 'COUNT')),

    value NUMERIC(14,4) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    priority INT NOT NULL DEFAULT 1,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_risk_rules_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_risk_rules_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT unique_rule_scope
        UNIQUE (user_id, strategy_id, rule_type)
);

CREATE INDEX IF NOT EXISTS idx_risk_rules_user_id ON risk_management_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_rules_strategy_id ON risk_management_rules(strategy_id);
CREATE INDEX IF NOT EXISTS idx_risk_rules_rule_type ON risk_management_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_risk_rules_is_active ON risk_management_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_risk_rules_deleted_at ON risk_management_rules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_risk_rules_metadata_gin ON risk_management_rules USING GIN (metadata);