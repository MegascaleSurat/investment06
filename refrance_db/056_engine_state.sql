-- File: server/src/db/migrations/056_engine_state.sql
-- Why needed: GET /api/engine/status reads from here. 
-- crashRecoveryWorker reads this on server restart to know which engines to resume.

CREATE TABLE IF NOT EXISTS engine_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_name VARCHAR(100) NOT NULL UNIQUE,
    
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ,
    
    status VARCHAR(20) DEFAULT 'IDLE', -- RUNNING, IDLE, CRASHED
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    pause_reason TEXT,
    
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_state_engine_name ON engine_state(engine_name);
CREATE INDEX IF NOT EXISTS idx_engine_state_status ON engine_state(status);
CREATE INDEX IF NOT EXISTS idx_engine_state_heartbeat ON engine_state(heartbeat_at);
