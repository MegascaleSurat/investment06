-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reusable trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. sector_master
CREATE TABLE sector_master (
    id SERIAL PRIMARY KEY,
    sector_name VARCHAR(100) UNIQUE NOT NULL,
    nifty_index_name VARCHAR(100),
    weightage NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. stock_master
CREATE TABLE stock_master (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(20) UNIQUE NOT NULL,
    stock_name VARCHAR(200) NOT NULL,
    sector_id INTEGER REFERENCES sector_master(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_fno BOOLEAN DEFAULT FALSE,
    lot_size INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. watchlist_upload
CREATE TABLE watchlist_upload (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(20) REFERENCES stock_master(stock_code),
    upload_date DATE DEFAULT CURRENT_DATE,
    source VARCHAR(50),
    UNIQUE(stock_code, upload_date)
);

-- 4. historical_daily_data
CREATE TABLE historical_daily_data (
    id BIGSERIAL PRIMARY KEY,
    stock_code VARCHAR(20) REFERENCES stock_master(stock_code),
    trade_date DATE NOT NULL,
    open_price NUMERIC(15,4),
    high_price NUMERIC(15,4),
    low_price NUMERIC(15,4),
    close_price NUMERIC(15,4),
    prev_close NUMERIC(15,4),
    volume BIGINT,
    avg_volume_10d BIGINT,
    UNIQUE(stock_code, trade_date)
);

-- 5. live_price_data
CREATE TABLE live_price_data (
    stock_code VARCHAR(20) PRIMARY KEY REFERENCES stock_master(stock_code),
    ltp NUMERIC(15,4) NOT NULL,
    change_pct NUMERIC(8,4),
    day_high NUMERIC(15,4),
    day_low NUMERIC(15,4),
    volume BIGINT,
    last_trade_time TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_live_price_updated_at 
BEFORE UPDATE ON live_price_data 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. stock_metrics
CREATE TABLE stock_metrics (
    stock_code VARCHAR(20) PRIMARY KEY REFERENCES stock_master(stock_code),
    volume_ratio NUMERIC(10,4),
    delivery_pct NUMERIC(5,2),
    relative_strength_idx NUMERIC(5,2),
    volatility_20d NUMERIC(5,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_stock_metrics_updated_at 
BEFORE UPDATE ON stock_metrics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. sector_metrics
CREATE TABLE sector_metrics (
    sector_id INTEGER PRIMARY KEY REFERENCES sector_master(id),
    sector_return_pct NUMERIC(8,4),
    breadth_pct NUMERIC(5,2),
    outperformance NUMERIC(8,4),
    status VARCHAR(20), -- STRONG, NEUTRAL, WEAK
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. market_metrics
CREATE TABLE market_metrics (
    id SERIAL PRIMARY KEY,
    trade_date DATE DEFAULT CURRENT_DATE,
    nifty_50_change_pct NUMERIC(8,4),
    midcap_100_change_pct NUMERIC(8,4),
    advance_decline_ratio NUMERIC(5,2),
    market_status VARCHAR(20), -- STRONG, NEUTRAL, WEAK
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. trade_orders
CREATE TABLE trade_orders (
    order_id VARCHAR(50) PRIMARY KEY, -- Kite Order ID
    stock_code VARCHAR(20) REFERENCES stock_master(stock_code),
    transaction_type VARCHAR(10), -- BUY, SELL
    order_type VARCHAR(10), -- MARKET, LIMIT, SL
    quantity INTEGER NOT NULL,
    price NUMERIC(15,4),
    status VARCHAR(20), -- COMPLETE, REJECTED, CANCELLED
    order_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. trade_positions
CREATE TABLE trade_positions (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(20) REFERENCES stock_master(stock_code),
    entry_price NUMERIC(15,4) NOT NULL,
    quantity INTEGER NOT NULL,
    stop_loss NUMERIC(15,4) NOT NULL,
    target_price NUMERIC(15,4),
    current_state VARCHAR(50) NOT NULL, -- ACTIVE, TRAILING, CLOSED
    entry_date DATE DEFAULT CURRENT_DATE,
    exit_date DATE,
    exit_price NUMERIC(15,4),
    pnl_amount NUMERIC(15,4),
    pnl_pct NUMERIC(8,4),
    strategy_model VARCHAR(20), -- MODEL1, MODEL2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sl_check CHECK (stop_loss < entry_price)
);

CREATE INDEX idx_position_status ON trade_positions(current_state);

-- 11. trade_logs
CREATE TABLE trade_logs (
    id BIGSERIAL PRIMARY KEY,
    trade_id INTEGER REFERENCES trade_positions(id),
    stock_code VARCHAR(20),
    event_type VARCHAR(50),
    from_state VARCHAR(50),
    to_state VARCHAR(50),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. alerts
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50),
    stock_code VARCHAR(20),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ADD-ON: Intraday Volume Tables
CREATE TABLE intraday_candles (
    id BIGSERIAL PRIMARY KEY,
    stock_code VARCHAR(20) REFERENCES stock_master(stock_code),
    trade_date DATE NOT NULL,
    candle_time TIME NOT NULL,
    open_price NUMERIC(15,4),
    high_price NUMERIC(15,4),
    low_price NUMERIC(15,4),
    close_price NUMERIC(15,4),
    volume BIGINT,
    UNIQUE(stock_code, trade_date, candle_time)
);

CREATE TABLE volume_baseline (
    stock_code VARCHAR(20) PRIMARY KEY REFERENCES stock_master(stock_code),
    avg_volume_15min BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE live_volume_signal (
    stock_code VARCHAR(20) PRIMARY KEY REFERENCES stock_master(stock_code),
    current_volume_ratio NUMERIC(10,4),
    signal_status VARCHAR(20), -- ABNORMAL, NORMAL
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_stock_master_code ON stock_master(stock_code);
CREATE INDEX idx_hist_stock_date ON historical_daily_data(stock_code, trade_date);
CREATE INDEX idx_intraday_stock_date_time ON intraday_candles(stock_code, trade_date, candle_time);
