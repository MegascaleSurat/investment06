-- File: server/src/db/migrations/053_confirmation_timers.sql
-- Why needed: SOP says price must remain above entry for full 5 minutes before BUY signal.
-- confirmationTimerWorker needs to persist timer state across cron runs.

CREATE TABLE IF NOT EXISTS confirmation_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID NOT NULL, -- FK to stocks
    user_id UUID NOT NULL, -- FK to users
    
    timer_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timer_expires_at TIMESTAMPTZ NOT NULL,
    timer_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED, TRIGGERED
    
    entry_price_at_start NUMERIC(12,2),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_confirmation_timers_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    CONSTRAINT fk_confirmation_timers_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure only one active timer per user/stock combination
    CONSTRAINT unique_active_confirmation_timer
        UNIQUE (stock_id, user_id, timer_status)
);

CREATE INDEX IF NOT EXISTS idx_confirmation_timers_stock_user ON confirmation_timers(stock_id, user_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_timers_expires ON confirmation_timers(timer_expires_at);
CREATE INDEX IF NOT EXISTS idx_confirmation_timers_status ON confirmation_timers(timer_status);
