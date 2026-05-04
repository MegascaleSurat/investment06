-- Per-user Kite app credentials (encrypted secret)
-- Note: Requires pgcrypto for gen_random_uuid() (enabled in earlier migrations)

CREATE TABLE IF NOT EXISTS kite_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  api_key TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kite_credentials_user_id ON kite_credentials (user_id);

