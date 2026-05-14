-- File: server/src/db/migrations/054_gtt_orders.sql
-- Why needed: placeStopLossWorker places GTT on Kite and must store the kite_gtt_id.
-- reconcilePositionsWorker compares our gtt_orders against Kite's active GTTs.

CREATE TABLE IF NOT EXISTS gtt_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL, -- FK to trades
    stock_id UUID NOT NULL, -- FK to stocks
    
    kite_gtt_id VARCHAR(100) NOT NULL,
    trigger_price NUMERIC(12,2) NOT NULL,
    gtt_status VARCHAR(20) NOT NULL, -- e.g., ACTIVE, TRIGGERED, CANCELLED
    gtt_type VARCHAR(20) NOT NULL, -- e.g., SINGLE, OCO
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_gtt_orders_trade
        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    CONSTRAINT fk_gtt_orders_stock
        FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_kite_gtt_id
        UNIQUE (kite_gtt_id)
);

CREATE INDEX IF NOT EXISTS idx_gtt_orders_trade_id ON gtt_orders(trade_id);
CREATE INDEX IF NOT EXISTS idx_gtt_orders_kite_gtt_id ON gtt_orders(kite_gtt_id);
CREATE INDEX IF NOT EXISTS idx_gtt_orders_status ON gtt_orders(gtt_status);
