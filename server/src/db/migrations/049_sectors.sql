-- File: server/src/db/migrations/049_sectors.sql

CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add sector_id to stocks table
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS sector_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_stocks_sector'
    ) THEN
        ALTER TABLE stocks
        ADD CONSTRAINT fk_stocks_sector
        FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stocks_sector_id ON stocks(sector_id);

-- Insert some default sectors
INSERT INTO sectors (name) VALUES 
('Technology'), ('Banking'), ('Energy'), ('Automobile'), 
('FMCG'), ('Pharmaceuticals'), ('Metals'), ('Real Estate'),
('Telecommunication'), ('Infrastructure')
ON CONFLICT (name) DO NOTHING;
