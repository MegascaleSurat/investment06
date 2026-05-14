-- File: server/src/db/migrations/055_trade_cooldowns.sql
-- Why needed: SOP rule: same stock cannot be re-entered for 1 trading day after closure.
-- cooldownTrackerWorker writes here when a trade closes.

CREATE TABLE IF NOT EXISTS trade_cooldowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL, -- FK to stocks
    user_id UUID NOT NULL, -- FK to users
    trade_id UUID, -- The trade that triggered the cooldown
    
    cooldown_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cooldown_expires TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_trade_cooldowns_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    CONSTRAINT fk_trade_cooldowns_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_trade_cooldowns_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trade_cooldowns_stock_user ON trade_cooldowns(stock_id, user_id);
CREATE INDEX IF NOT EXISTS idx_trade_cooldowns_expires ON trade_cooldowns(cooldown_expires);
CREATE INDEX IF NOT EXISTS idx_trade_cooldowns_is_active ON trade_cooldowns(is_active);
