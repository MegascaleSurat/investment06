-- File: server/src/db/migrations/010_strategy_rules.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS strategy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    strategy_id UUID NOT NULL,

    rule_type VARCHAR(30) NOT NULL
        CHECK (rule_type IN ('ENTRY', 'EXIT', 'FILTER', 'RISK', 'TIME')),

    rule_name VARCHAR(150) NOT NULL,

    priority INT NOT NULL DEFAULT 1,

    conditions JSONB NOT NULL,
    actions JSONB,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_strategy_rules_strategy
        FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,

    CONSTRAINT unique_strategy_rule_name
        UNIQUE (strategy_id, rule_name)
);

CREATE INDEX IF NOT EXISTS idx_strategy_rules_strategy_id ON strategy_rules(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_rule_type ON strategy_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_priority ON strategy_rules(priority);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_is_active ON strategy_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_deleted_at ON strategy_rules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_conditions_gin ON strategy_rules USING GIN (conditions);
CREATE INDEX IF NOT EXISTS idx_strategy_rules_actions_gin ON strategy_rules USING GIN (actions);