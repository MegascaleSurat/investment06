-- File: server/src/db/migrations/005_stocks.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- stocks table exists from earlier migrations (as BIGSERIAL). Most other tables
-- use UUID primary keys, so normalize stocks.id to UUID for FK compatibility.
-- This migration is designed for dev/local usage; it may rebuild the table.

DO $$
DECLARE
  id_udt_name TEXT;
BEGIN
  SELECT c.udt_name
    INTO id_udt_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'stocks'
    AND c.column_name = 'id';

  -- If stocks doesn't exist yet, just create it with UUID id.
  IF id_udt_name IS NULL THEN
    CREATE TABLE IF NOT EXISTS stocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instrument_key VARCHAR(100), -- Exact name from SOP
      symbol VARCHAR(50) NOT NULL,
      exchange VARCHAR(50) NOT NULL DEFAULT 'NSE',
      name VARCHAR(255) NOT NULL,
      instrument_type VARCHAR(20) NOT NULL DEFAULT 'EQUITY',
      segment VARCHAR(20) NOT NULL DEFAULT 'CASH',
      isin VARCHAR(20),
      lot_size INT NOT NULL DEFAULT 1,
      tick_size NUMERIC(10, 4),
      sector_id UUID, -- FK to sectors
      sub_sector VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      is_tradeable BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Required by SOP
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT unique_symbol_exchange UNIQUE (symbol, exchange),
      CONSTRAINT stocks_instrument_type_check
        CHECK (instrument_type IN ('EQUITY', 'FUTURE', 'OPTION', 'INDEX')),
      CONSTRAINT stocks_segment_check
        CHECK (segment IN ('CASH', 'FNO')),
      CONSTRAINT stocks_status_check
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
      CONSTRAINT fk_stocks_sector
        FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL
    );
    RETURN;
  END IF;

  -- If id is BIGINT (int8), rebuild the table with UUID id.
  IF id_udt_name = 'int8' THEN
    CREATE TABLE stocks__tmp (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instrument_key VARCHAR(100),
      symbol VARCHAR(50) NOT NULL,
      exchange VARCHAR(50) NOT NULL DEFAULT 'NSE',
      name VARCHAR(255) NOT NULL,
      instrument_type VARCHAR(20) NOT NULL DEFAULT 'EQUITY',
      segment VARCHAR(20) NOT NULL DEFAULT 'CASH',
      isin VARCHAR(20),
      lot_size INT NOT NULL DEFAULT 1,
      tick_size NUMERIC(10, 4),
      sector_id UUID,
      sub_sector VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      is_tradeable BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    INSERT INTO stocks__tmp (
      id,
      symbol,
      exchange,
      name,
      instrument_type,
      segment,
      isin,
      lot_size,
      tick_size,
      status,
      is_tradeable,
      is_active,
      created_at,
      updated_at,
      deleted_at
    )
    SELECT
      gen_random_uuid(),
      s.symbol::VARCHAR(50),
      COALESCE(s.exchange, 'NSE')::VARCHAR(50),
      s.name::VARCHAR(255),
      'EQUITY'::VARCHAR(20),
      'CASH'::VARCHAR(20),
      s.isin::VARCHAR(20),
      1,
      NULL,
      CASE WHEN COALESCE(s.active, TRUE) THEN 'ACTIVE' ELSE 'INACTIVE' END::VARCHAR(20),
      COALESCE(s.active, TRUE),
      COALESCE(s.active, TRUE),
      COALESCE(s.created_at, NOW()),
      COALESCE(s.updated_at, NOW()),
      NULL
    FROM stocks s;

    DROP TABLE stocks;
    ALTER TABLE stocks__tmp RENAME TO stocks;
  END IF;
END $$;

ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS instrument_type VARCHAR(20) NOT NULL DEFAULT 'EQUITY',
  ADD COLUMN IF NOT EXISTS segment VARCHAR(20) NOT NULL DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS lot_size INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tick_size NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS sector_id UUID,
  ADD COLUMN IF NOT EXISTS sub_sector VARCHAR(100),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS is_tradeable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instrument_key VARCHAR(100);

-- Enforce allowed values (idempotent via exception handling).
DO $$
BEGIN
  ALTER TABLE stocks
    ADD CONSTRAINT stocks_instrument_type_check
      CHECK (instrument_type IN ('EQUITY', 'FUTURE', 'OPTION', 'INDEX'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE stocks
    ADD CONSTRAINT stocks_segment_check
      CHECK (segment IN ('CASH', 'FNO'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE stocks
    ADD CONSTRAINT stocks_status_check
      CHECK (status IN ('ACTIVE', 'INACTIVE'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Prefer uniqueness on (symbol, exchange). Existing schema might already enforce
-- unique(symbol); adding this is safe in most cases and will no-op if it exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_symbol_exchange'
      AND conrelid = 'public.stocks'::regclass
  ) THEN
    ALTER TABLE stocks
      ADD CONSTRAINT unique_symbol_exchange UNIQUE (symbol, exchange);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON stocks (exchange);
CREATE INDEX IF NOT EXISTS idx_stocks_instrument_type ON stocks (instrument_type);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks (status);
CREATE INDEX IF NOT EXISTS idx_stocks_is_tradeable ON stocks (is_tradeable);
CREATE INDEX IF NOT EXISTS idx_stocks_deleted_at ON stocks (deleted_at);
