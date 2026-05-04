-- File: server/src/db/migrations/048_watchlist_items.sql

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL,
    symbol_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_watchlist_items_watchlist
        FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_watchlist_items_symbol
        FOREIGN KEY (symbol_id) REFERENCES stock_symbols(id) ON DELETE CASCADE,

    CONSTRAINT unique_watchlist_symbol
        UNIQUE (watchlist_id, symbol_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
