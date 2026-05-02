-- Migration: Create user_broker_accounts table
CREATE TABLE IF NOT EXISTS user_broker_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  broker VARCHAR(50) NOT NULL, -- 'zerodha'
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  access_token TEXT,
  public_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_broker_user_id
ON user_broker_accounts(user_id);
