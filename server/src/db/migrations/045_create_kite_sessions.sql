-- Kite sessions table
-- Note: Requires pgcrypto for gen_random_uuid() (enabled in earlier migrations)

CREATE TABLE IF NOT EXISTS kite_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  access_token TEXT NOT NULL,
  public_token TEXT,
  api_key TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_kite_sessions_user_id ON kite_sessions (user_id);

