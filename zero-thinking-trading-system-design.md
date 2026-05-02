# Zero-Thinking Trading System
## Complete Production-Grade System Design

**Version:** 1.0  
**Stack:** Node.js · PostgreSQL · Redis · BullMQ · React · Zerodha Kite API  
**Architecture:** Modular Monolith  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Services](#2-core-services)
3. [Data Flow](#3-data-flow)
4. [Database Design](#4-database-design)
5. [Real-Time Architecture](#5-real-time-architecture)
6. [Strategy Engine Design](#6-strategy-engine-design)
7. [State Machine](#7-state-machine)
8. [Background Jobs](#8-background-jobs)
9. [Fault Tolerance & Recovery](#9-fault-tolerance--recovery)
10. [Scaling Strategy](#10-scaling-strategy)
11. [Security Design](#11-security-design)
12. [API Design](#12-api-design)
13. [Testing Strategy](#13-testing-strategy)
14. [Failure Scenarios](#14-failure-scenarios)

---

## 1. System Overview

### Architecture Decision: Modular Monolith

**Choice: Modular Monolith — NOT microservices.**

**Why not microservices:**
- Trading systems require synchronous, low-latency coordination between order execution, position management, and risk checks. Network hops between microservices add 5–20ms per call — unacceptable when a tick must be processed, a signal generated, and an order placed inside one tick cycle (~500ms window).
- Distributed transactions across services (e.g. atomically updating a position AND placing an order AND logging) require sagas or 2PC — both add complexity and failure surface.
- The team is small. Microservices require dedicated DevOps, separate CI/CD pipelines, and service mesh overhead.
- Data volume is not at hyperscale. A single PostgreSQL instance with proper indexing handles millions of trade records.

**Why modular monolith:**
- All modules share one process and database connection pool — coordination is function calls, not HTTP.
- Module boundaries are enforced by code structure, not network — clean separation without distributed overhead.
- Can be split into microservices later if volume demands it — module boundaries are the extraction points.
- Single deployment, single monitoring surface, single log stream.

### High-Level Component Map

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js Process                       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Broker  │  │  Market  │              │
│  │ Service  │  │Integration│  │  Data   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Strategy │  │  Order   │  │ Position │              │
│  │  Engine  │  │Execution │  │ Manager  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Risk   │  │Notif.    │  │Analytics │              │
│  │ Manager  │  │Service   │  │Service   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
         │                │               │
    PostgreSQL          Redis          BullMQ
    (persistent)     (cache/state)   (job queues)
```

---

## 2. Core Services

### 2.1 Auth Service

**Responsibility:** User registration, login, JWT issuance, refresh token management, session invalidation.

**Internal Modules:**
- `auth.controller.js` — Express route handlers
- `auth.service.js` — Business logic
- `auth.repository.js` — DB queries against `users` table
- `token.service.js` — JWT sign/verify, refresh token rotation
- `password.service.js` — bcrypt hashing, comparison

**APIs:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

**Data Handled:**
- `users` table (id, email, password_hash, role, created_at)
- Redis key `refresh:{userId}` — refresh token string, TTL 7 days
- JWT payload: `{ userId, email, role, iat, exp }` — 15 min expiry
- Refresh token: opaque 256-bit random hex, stored in Redis

**Key Decisions:**
- RS256 signing (asymmetric). Public key distributed to all modules. Private key in env only.
- Refresh token rotation: each use issues a new refresh token and invalidates the previous.
- Logout: DELETE `refresh:{userId}` from Redis. JWT is short-lived and not blacklisted — 15 min acceptable window.

---

### 2.2 Broker Integration Service

**Responsibility:** Manage Zerodha Kite OAuth flow, store and rotate access tokens, expose a unified broker API wrapper used by all other services. No other service calls Kite directly.

**Internal Modules:**
- `broker.controller.js` — OAuth callback handler
- `broker.service.js` — Kite API wrapper (place order, fetch positions, cancel order)
- `token.repository.js` — CRUD on `access_tokens` table
- `kite.client.js` — Singleton KiteConnect instance per user

**APIs:**
```
GET  /api/broker/login-url          → Returns Kite login redirect URL
GET  /api/broker/callback           → Handles request_token, exchanges for access_token
GET  /api/broker/status             → Returns broker connection status for current user
DELETE /api/broker/disconnect       → Revoke access token
```

**OAuth Flow:**
1. User calls `GET /broker/login-url` → backend builds URL: `https://kite.zerodha.com/connect/login?api_key=...`
2. User redirected to Kite, authenticates
3. Kite redirects to `GET /broker/callback?request_token=...`
4. Backend calls `kite.generateSession(request_token, api_secret)` → returns `access_token`
5. `access_token` stored in `access_tokens` table + Redis key `kite:token:{userId}` TTL 24h
6. On every API call, token loaded from Redis (fallback to DB if cache miss)

**Data Handled:**
- `broker_accounts` table
- `access_tokens` table
- Redis: `kite:token:{userId}` — access_token string

---

### 2.3 Market Data Service

**Responsibility:** Maintain WebSocket connection to Zerodha KiteTicker, process incoming ticks, normalize and distribute to internal consumers via EventEmitter, maintain rolling OHLCV buffers.

**Internal Modules:**
- `ticker.manager.js` — Manages KiteTicker lifecycle (connect, subscribe, reconnect)
- `tick.processor.js` — Normalizes raw ticks, maps tokens to symbols
- `ohlcv.buffer.js` — In-memory rolling candle builder (1-min, 5-min)
- `market.broadcaster.js` — EventEmitter that fires `tick:{symbol}` events
- `instrument.registry.js` — Token↔symbol mapping, loaded at startup from Kite instruments API

**APIs (internal only — no HTTP endpoints for tick data):**
```
marketDataService.subscribe(tokens[])
marketDataService.getLastTick(symbol) → TickData
marketDataService.getOHLCV(symbol, timeframe) → Candle[]
```

**Tick Data Shape (normalized):**
```js
{
  symbol: 'RELIANCE',
  token: 738561,
  ltp: 2840.50,
  open: 2820.00,
  high: 2855.00,
  low: 2810.00,
  close: 2838.00,
  volume: 1245600,
  oi: 0,
  timestamp: '2024-01-15T09:35:00.000+05:30'
}
```

**Data Handled:**
- In-memory: `Map<symbol, TickData>` — latest tick per symbol
- In-memory: `Map<symbol, Candle[]>` — rolling 1-min OHLCV, max 200 candles
- No tick data written to DB (volume too high — 10k ticks/sec)

---

### 2.4 Strategy Engine

**Responsibility:** Subscribe to tick events, evaluate entry/exit conditions for each registered strategy, emit signals when conditions are met.

**Internal Modules:**
- `strategy.registry.js` — Loads and maps strategy instances
- `strategy.runner.js` — Subscribes to `tick:{symbol}` events, routes to correct strategy
- `model1.strategy.js` — Breakout + time-based exit logic
- `model2.strategy.js` — Momentum + trailing + partial booking
- `indicator.lib.js` — EMA, RSI, MACD, ATR calculations (pure functions)
- `signal.validator.js` — Deduplication, rate limiting per symbol

**Internal API:**
```js
strategyEngine.registerStrategy(userId, strategyConfig)
strategyEngine.unregisterStrategy(userId)
// Emits: signal:entry, signal:exit
```

**Data Handled:**
- Reads from `ohlcv.buffer.js` — in-memory candles
- Reads from Redis: `strategy:config:{userId}` — user strategy settings
- Writes signals to `signals` table (async, non-blocking via logQueue)

---

### 2.5 Order Execution Service

**Responsibility:** Translate signals into broker orders, handle order lifecycle (placement, polling, fill confirmation, rejection), manage retries.

**Internal Modules:**
- `order.service.js` — Core order placement logic
- `order.repository.js` — DB operations on `orders` table
- `order.poller.js` — Polls Kite order status after placement
- `slippage.calculator.js` — Computes limit price from LTP + buffer

**APIs:**
```
POST /api/orders/place          → Manual order placement (admin use)
GET  /api/orders                → List orders for authenticated user
GET  /api/orders/:orderId       → Get specific order details
POST /api/orders/:orderId/cancel
```

**Order Placement Flow:**
```
1. Receive PlaceOrderCommand from Position Manager
2. Calculate limit price = LTP ± slippage_buffer (0.05%)
3. Build Kite order payload:
   { tradingsymbol, exchange, transaction_type, quantity,
     order_type: 'LIMIT', price, product: 'MIS', validity: 'DAY' }
4. Call kite.placeOrder('regular', payload) → order_id
5. INSERT into orders table with status=PENDING
6. Enqueue order_id to orderPollQueue (BullMQ)
7. Return order_id to caller
```

**Data Handled:**
- `orders` table — full order lifecycle
- BullMQ: `orderPollQueue` — order_id jobs for status polling

---

### 2.6 Position Manager (State Machine)

**Responsibility:** Owns the lifecycle of every open position. Is the single source of truth for position state. Coordinates between Strategy Engine, Order Execution, and Risk Manager.

**Internal Modules:**
- `position.machine.js` — State machine implementation
- `position.repository.js` — DB CRUD on `positions` table
- `position.monitor.js` — Subscribes to ticks for open positions, evaluates exit conditions on every tick
- `exit.coordinator.js` — Decides which exit type to trigger

**State Machine States:** IDLE → SIGNAL_GENERATED → ORDER_PLACED → POSITION_OPEN → PARTIAL_EXIT → TRAILING_ACTIVE → EXITED

**APIs:**
```
GET  /api/positions              → All positions for user
GET  /api/positions/:id          → Position detail with history
POST /api/positions/:id/exit     → Force manual exit
GET  /api/positions/:id/pnl      → Real-time P&L for position
```

**Data Handled:**
- `positions` table — state, entry price, qty, SL, target, trailing_sl
- Redis: `position:state:{positionId}` — current state (for fast reads)

---

### 2.7 Risk Management Service

**Responsibility:** Gate every order placement with risk checks. Stateless validator — returns allow/block decision synchronously.

**Checks performed (in order):**
1. `maxOpenPositions` — default: 5 simultaneous positions per user
2. `capitalPerTrade` — default: max 10% of account capital per trade
3. `dailyLossLimit` — halt trading if day P&L < -2% of capital
4. `symbolCooldown` — no re-entry on same symbol within 30 minutes of exit
5. `marketHours` — no entries before 09:20 IST or after 15:00 IST
6. `circuitBreakerActive` — halt if 3 consecutive order failures

**Internal Modules:**
- `risk.service.js` — Orchestrates all checks
- `risk.config.repository.js` — Loads user risk config from DB
- `circuit.breaker.js` — Tracks consecutive failures in Redis

**APIs (internal only):**
```js
await riskService.validateEntry(userId, signal) → { allowed: bool, reason: string }
await riskService.validateExit(userId, positionId) → { allowed: bool }
await riskService.getDailyStats(userId) → { openPositions, dayPnl, tradeCount }
```

**Data Handled:**
- Redis: `risk:consecutive_failures:{userId}` — integer counter
- Redis: `risk:cooldown:{userId}:{symbol}` — TTL 30 min
- DB: `trades` table — read-only for daily P&L aggregation

---

### 2.8 Notification Service

**Responsibility:** Push real-time events to connected React clients via WebSocket. Also handles Telegram alerts for critical events (optional channel).

**Internal Modules:**
- `ws.server.js` — Express ws upgrade handler, connection registry
- `ws.broadcaster.js` — Broadcast to specific user's connections or all connections
- `notification.events.js` — Event type definitions and payloads

**Event Types:**
```js
TICK_UPDATE       → throttled LTP update per subscribed symbol
POSITION_UPDATE   → state change on any of user's positions
ORDER_UPDATE      → order status change (PENDING→FILLED, REJECTED)
ALERT_ERROR       → critical system error
ALERT_SIGNAL      → new signal generated
DAILY_SUMMARY     → EOD P&L and trade stats
SYSTEM_STATUS     → system halted / resumed
```

**Architecture:**
- Each user connection stored in `Map<userId, Set<WebSocket>>`
- Supports multiple browser tabs per user
- Heartbeat: ping/pong every 30s, close dead connections after 2 missed pings

---

## 3. Data Flow

### Complete Flow: Login → Trade → Exit → Log

#### Phase 1: Authentication (Sync)

```
1. POST /api/auth/login {email, password}
2. AuthService: SELECT user FROM users WHERE email=?
3. bcrypt.compare(password, hash) → bool
4. If valid: jwt.sign({userId, email}, privateKey, {algorithm:'RS256', expiresIn:'15m'})
5. Generate refresh token (crypto.randomBytes(32).toString('hex'))
6. Redis: SET refresh:{userId} {token} EX 604800
7. Response: { accessToken, refreshToken, expiresIn: 900 }
```

#### Phase 2: Broker Connect (Sync + Async)

```
1. GET /api/broker/callback?request_token=xxx
2. BrokerService: kite.generateSession(request_token, api_secret)
3. → access_token returned from Kite
4. DB: INSERT INTO access_tokens (userId, token, expires_at)
5. Redis: SET kite:token:{userId} {access_token} EX 86400
6. Initialize KiteConnect instance for this user
7. KiteTicker.connect() with access_token
8. KiteTicker.subscribe([all_configured_tokens]) mode=full
9. Emit: system:broker_connected to WS clients
```

#### Phase 3: Market Data → Signal (Async, Event-Driven)

```
1. [ASYNC] KiteTicker fires on_ticks(ticks[])
2. TickProcessor: for each tick
   a. Map token → symbol using InstrumentRegistry
   b. Attach IST timestamp
   c. Update in-memory Map<symbol, TickData>
   d. Update rolling OHLCV buffer for symbol
3. MarketBroadcaster: emit('tick:{symbol}', normalizedTick)
4. StrategyRunner (listening on 'tick:{symbol}'):
   a. Retrieve candles from OHLCVBuffer
   b. Calculate indicators (EMA, RSI, MACD)
   c. Evaluate entry conditions for each registered strategy
5. If entry condition met:
   a. SignalValidator.checkDuplicate:
      Redis: SET NX trade:{userId}:{symbol}:{date} 1 EX 86400
      → If key exists: SKIP (duplicate prevention)
   b. Emit signal to PositionManager
6. [ASYNC — non-blocking] Log signal to signals table via logQueue
```

#### Phase 4: Signal → Order → Position (Sync for state, Async for I/O)

```
1. PositionManager receives signal
2. SYNC: RiskService.validateEntry(userId, signal)
   → Checks: openPositions, capital, dailyLoss, cooldown, marketHours, circuitBreaker
   → If blocked: log rejection, notify WS, return
3. SYNC: PositionRepository.create({userId, symbol, state: 'SIGNAL_GENERATED', ...})
   → DB write is synchronous (must succeed before proceeding)
4. Redis: SET position:state:{positionId} 'SIGNAL_GENERATED'
5. SYNC: OrderExecutionService.placeOrder({...payload})
   a. Build limit price with slippage
   b. kite.placeOrder(payload) → order_id
   c. DB: INSERT INTO orders (positionId, order_id, status: 'PENDING')
6. SYNC: PositionRepository.updateState(positionId, 'ORDER_PLACED')
7. Notify WS: POSITION_UPDATE event
8. [ASYNC] BullMQ: orderPollQueue.add({orderId, positionId}, {delay: 500})
```

#### Phase 5: Order Fill Confirmation (Async BullMQ Worker)

```
orderPollQueue worker:
1. Fetch job: {orderId, positionId}
2. kite.getOrderHistory(orderId) → status
3. If status == 'COMPLETE':
   a. DB: UPDATE orders SET status='FILLED', fill_price, fill_qty
   b. PositionManager.transitionToOpen(positionId, fill_price, fill_qty)
   c. SYNC DB: UPDATE positions SET state='POSITION_OPEN', entry_price, entry_time
   d. Notify WS: POSITION_UPDATE
   e. Start position monitoring for this positionId
4. If status == 'REJECTED':
   a. DB: UPDATE orders SET status='REJECTED', rejection_reason
   b. PositionManager.transitionToIdle(positionId)
   c. RiskService.recordFailure(userId) → circuit breaker
   d. Notify WS: ORDER_UPDATE (rejected)
5. If status == 'PENDING' and age < 60s: re-enqueue with delay 1000ms
6. If status == 'PENDING' and age >= 60s: cancel order, mark TIMEOUT, → IDLE
```

#### Phase 6: Position Monitoring → Exit (Sync on each tick)

```
PositionMonitor subscribes to 'tick:{symbol}' for each OPEN position:

On every tick for symbol:
1. Get current position from Redis (fast lookup)
2. Check SL: if ltp <= initial_sl → exitType = 'SL'
3. Check partial target: if ltp >= target1 AND state == 'POSITION_OPEN' → exitType = 'PARTIAL'
4. Check full target: if ltp >= target2 → exitType = 'FULL_TARGET'
5. Check trailing: if state == 'TRAILING_ACTIVE'
   a. New trailing_sl = max(current trailing_sl, ltp - trail_offset)
   b. If ltp <= trailing_sl → exitType = 'TRAILING_SL'
6. Check time: if currentTime >= 15:15 IST → exitType = 'TIME_EXIT'

If exitType determined:
→ ExitCoordinator.executeExit(positionId, exitType, qty)
  1. SYNC DB: UPDATE positions SET state=exit_state
  2. OrderExecutionService.placeOrder({side: SELL, ...})
  3. BullMQ: exitOrderPollQueue.add(...)
```

#### Phase 7: Post-Exit Logging (Async)

```
After position reaches EXITED state:
1. [ASYNC] logQueue.add('trade_complete', { positionId, ... })
2. logQueue worker:
   a. Compute realized P&L: (exit_price - entry_price) * qty * lot_size
   b. Compute commissions: brokerage + STT + exchange_charges + GST + SEBI
   c. DB: INSERT INTO trades (...all fields including net_pnl, commissions)
   d. DB: UPDATE analytics_daily SET total_pnl, trade_count, win_count
3. NotificationService: broadcast DAILY_SUMMARY update to WS
```

### Queue Inventory

| Queue | Purpose | Concurrency | Retry |
|---|---|---|---|
| `orderPollQueue` | Poll order fill status | 1 (sequential) | 3x with 1s backoff |
| `exitOrderPollQueue` | Poll exit order status | 1 | 3x with 1s backoff |
| `logQueue` | Async DB writes | 5 (parallel) | 5x with exp backoff |
| `cronQueue` | Scheduled jobs (token refresh, daily reset) | 1 | 3x with 5m backoff |
| `notifQueue` | Telegram/email notifications | 3 | 2x |

---

## 4. Database Design

### users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255),
  role          VARCHAR(20) NOT NULL DEFAULT 'trader'
                  CHECK (role IN ('trader', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### broker_accounts

```sql
CREATE TABLE broker_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker        VARCHAR(50) NOT NULL DEFAULT 'zerodha',
  client_id     VARCHAR(100) NOT NULL,
  api_key       VARCHAR(255) NOT NULL,
  -- api_secret stored encrypted in application layer, NOT in DB
  is_connected  BOOLEAN NOT NULL DEFAULT false,
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, broker)
);

CREATE INDEX idx_broker_accounts_user_id ON broker_accounts(user_id);
```

### access_tokens

```sql
CREATE TABLE access_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_account_id UUID NOT NULL REFERENCES broker_accounts(id),
  token_encrypted TEXT NOT NULL,     -- AES-256-GCM encrypted
  token_hash      VARCHAR(64) NOT NULL, -- SHA-256 of plaintext, for lookup
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  is_active       BOOLEAN GENERATED ALWAYS AS (
                    revoked_at IS NULL AND expires_at > NOW()
                  ) STORED
);

CREATE INDEX idx_access_tokens_user_id ON access_tokens(user_id);
CREATE INDEX idx_access_tokens_active ON access_tokens(user_id) WHERE revoked_at IS NULL;
```

### sectors

```sql
CREATE TABLE sectors (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,  -- 'BANKING', 'IT', 'PHARMA'
  index_symbol  VARCHAR(50),   -- 'NIFTY BANK', 'NIFTY IT'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### stocks

```sql
CREATE TABLE stocks (
  id                  SERIAL PRIMARY KEY,
  symbol              VARCHAR(50) NOT NULL UNIQUE,  -- 'RELIANCE', 'TCS'
  trading_symbol      VARCHAR(50) NOT NULL,         -- 'RELIANCE', exchange specific
  exchange            VARCHAR(10) NOT NULL DEFAULT 'NSE',
  instrument_token    BIGINT NOT NULL UNIQUE,        -- Zerodha token
  sector_id           INTEGER REFERENCES sectors(id),
  lot_size            INTEGER NOT NULL DEFAULT 1,
  tick_size           NUMERIC(10,2) NOT NULL DEFAULT 0.05,
  is_tradeable        BOOLEAN NOT NULL DEFAULT true,
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_token ON stocks(instrument_token);
CREATE INDEX idx_stocks_sector ON stocks(sector_id);
CREATE INDEX idx_stocks_tradeable ON stocks(is_tradeable) WHERE is_tradeable = true;
```

### signals

```sql
CREATE TABLE signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  stock_id        INTEGER NOT NULL REFERENCES stocks(id),
  strategy_name   VARCHAR(50) NOT NULL,  -- 'MODEL1', 'MODEL2'
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price     NUMERIC(12,4) NOT NULL,
  target_1        NUMERIC(12,4),
  target_2        NUMERIC(12,4),
  initial_sl      NUMERIC(12,4) NOT NULL,
  quantity        INTEGER NOT NULL,
  indicators      JSONB,   -- {ema20: 2800, ema50: 2750, rsi: 62, ...}
  status          VARCHAR(20) NOT NULL DEFAULT 'GENERATED'
                    CHECK (status IN ('GENERATED', 'ACCEPTED', 'REJECTED', 'DUPLICATE')),
  rejection_reason VARCHAR(255),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_user_id ON signals(user_id);
CREATE INDEX idx_signals_generated_at ON signals(generated_at DESC);
CREATE INDEX idx_signals_status ON signals(status);
```

### orders

```sql
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id         UUID NOT NULL REFERENCES positions(id),
  user_id             UUID NOT NULL REFERENCES users(id),
  broker_order_id     VARCHAR(100),     -- Zerodha order_id
  order_type          VARCHAR(20) NOT NULL, -- 'ENTRY', 'EXIT_SL', 'EXIT_TARGET', 'EXIT_PARTIAL', 'EXIT_TIME'
  transaction_type    VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity            INTEGER NOT NULL,
  requested_price     NUMERIC(12,4),
  fill_price          NUMERIC(12,4),
  fill_quantity       INTEGER,
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'OPEN', 'FILLED', 'REJECTED', 'CANCELLED', 'TIMEOUT')),
  rejection_reason    VARCHAR(500),
  placed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at           TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_position_id ON orders(position_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status) WHERE status IN ('PENDING', 'OPEN');
CREATE INDEX idx_orders_broker_order_id ON orders(broker_order_id);
```

### positions

```sql
CREATE TABLE positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  signal_id       UUID REFERENCES signals(id),
  stock_id        INTEGER NOT NULL REFERENCES stocks(id),
  strategy_name   VARCHAR(50) NOT NULL,
  state           VARCHAR(30) NOT NULL DEFAULT 'SIGNAL_GENERATED'
                    CHECK (state IN (
                      'IDLE', 'SIGNAL_GENERATED', 'ORDER_PLACED',
                      'POSITION_OPEN', 'PARTIAL_EXIT', 'TRAILING_ACTIVE', 'EXITED'
                    )),
  direction       VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  quantity        INTEGER NOT NULL,
  remaining_qty   INTEGER NOT NULL,
  entry_price     NUMERIC(12,4),
  exit_price      NUMERIC(12,4),         -- weighted avg exit price
  initial_sl      NUMERIC(12,4) NOT NULL,
  current_sl      NUMERIC(12,4) NOT NULL, -- updates as trailing SL moves
  target_1        NUMERIC(12,4),
  target_2        NUMERIC(12,4),
  trailing_sl     NUMERIC(12,4),
  trail_offset    NUMERIC(12,4),
  partial_exit_qty INTEGER DEFAULT 0,
  partial_exit_price NUMERIC(12,4),
  unrealized_pnl  NUMERIC(14,4),         -- updated on each tick write (not every tick)
  realized_pnl    NUMERIC(14,4) DEFAULT 0,
  state_history   JSONB DEFAULT '[]',    -- [{state, ts, reason}]
  entry_time      TIMESTAMPTZ,
  exit_time       TIMESTAMPTZ,
  exit_reason     VARCHAR(50),           -- 'SL_HIT', 'TARGET1', 'TARGET2', 'TIME_EXIT', 'MANUAL', 'TRAILING_SL'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_state ON positions(state) WHERE state NOT IN ('EXITED', 'IDLE');
CREATE INDEX idx_positions_stock_id ON positions(stock_id);
CREATE INDEX idx_positions_entry_time ON positions(entry_time DESC);
```

### trades (finalized, immutable record)

```sql
CREATE TABLE trades (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id       UUID NOT NULL UNIQUE REFERENCES positions(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  stock_id          INTEGER NOT NULL REFERENCES stocks(id),
  strategy_name     VARCHAR(50) NOT NULL,
  direction         VARCHAR(10) NOT NULL,
  entry_price       NUMERIC(12,4) NOT NULL,
  exit_price        NUMERIC(12,4) NOT NULL,
  quantity          INTEGER NOT NULL,
  gross_pnl         NUMERIC(14,4) NOT NULL,
  brokerage         NUMERIC(10,4) NOT NULL,
  stt               NUMERIC(10,4) NOT NULL,
  exchange_charges  NUMERIC(10,4) NOT NULL,
  gst               NUMERIC(10,4) NOT NULL,
  sebi_charges      NUMERIC(10,4) NOT NULL,
  stamp_duty        NUMERIC(10,4) NOT NULL,
  total_charges     NUMERIC(10,4) NOT NULL,
  net_pnl           NUMERIC(14,4) NOT NULL,
  exit_reason       VARCHAR(50) NOT NULL,
  entry_time        TIMESTAMPTZ NOT NULL,
  exit_time         TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER,
  trade_date        DATE NOT NULL,     -- for partitioning
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (trade_date);

CREATE TABLE trades_2024 PARTITION OF trades
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE trades_2025 PARTITION OF trades
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date DESC);
CREATE INDEX idx_trades_strategy ON trades(strategy_name, trade_date);
```

### analytics_daily

```sql
CREATE TABLE analytics_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  trade_date      DATE NOT NULL,
  total_trades    INTEGER NOT NULL DEFAULT 0,
  winning_trades  INTEGER NOT NULL DEFAULT 0,
  losing_trades   INTEGER NOT NULL DEFAULT 0,
  gross_pnl       NUMERIC(14,4) NOT NULL DEFAULT 0,
  total_charges   NUMERIC(10,4) NOT NULL DEFAULT 0,
  net_pnl         NUMERIC(14,4) NOT NULL DEFAULT 0,
  max_drawdown    NUMERIC(14,4),
  win_rate        NUMERIC(5,2),   -- percentage
  avg_win         NUMERIC(14,4),
  avg_loss        NUMERIC(14,4),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trade_date)
);

CREATE INDEX idx_analytics_user_date ON analytics_daily(user_id, trade_date DESC);
```

### logs (system events)

```sql
CREATE TABLE logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  level       VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'FATAL')),
  category    VARCHAR(50) NOT NULL,  -- 'ORDER', 'POSITION', 'AUTH', 'RISK', 'SYSTEM'
  message     TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE logs_2024_q1 PARTITION OF logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
-- Create quarterly partitions for 2024-2025

CREATE INDEX idx_logs_user_level ON logs(user_id, level, created_at DESC);
CREATE INDEX idx_logs_category ON logs(category, created_at DESC);
```

---

## 5. Real-Time Architecture

### WebSocket Stack

```
Zerodha KiteTicker (binary WebSocket)
         ↓
   ticker.manager.js
   (receives on_ticks callbacks)
         ↓
   tick.processor.js
   (normalize, map token→symbol, timestamp)
         ↓
   ohlcv.buffer.js          market.broadcaster.js
   (update rolling candle)   (EventEmitter: emit tick:{symbol})
         ↓                          ↓
   strategy.runner.js        ws.broadcaster.js
   (evaluate signals)        (push to React clients)
```

### Tick Processing Pipeline

```js
// ticker.manager.js
ticker.on('ticks', (ticks) => {
  for (const tick of ticks) {
    const normalized = tickProcessor.normalize(tick);
    ohlcvBuffer.update(normalized.symbol, normalized);
    broadcaster.emit(`tick:${normalized.symbol}`, normalized);
  }
});
```

**Performance constraints:**
- KiteTicker can deliver 10,000+ ticks/second during high-volatility periods
- EventEmitter is synchronous — listeners must be non-blocking
- Strategy evaluation must complete in < 1ms to avoid backpressure

**Throttling to Frontend:**
- Frontend WS clients do NOT receive raw ticks
- `ws.broadcaster.js` throttles to 500ms per symbol using per-symbol `lastSentAt` timestamps
- Only LTP + P&L change sent to frontend, not full tick
- If position unrealized P&L changes > 0.01%, push update; else skip

### Load Handling

- KiteTicker: one connection per broker account (Zerodha allows 3000 symbols/connection)
- If user subscribes to > 3000 symbols: open second KiteTicker connection, split tokens
- In-memory OHLCV buffer: capped at 200 candles per symbol × 500 symbols = 100k candle objects (~8MB RAM)
- Instrument registry: loaded once at startup, refreshed at 08:30 IST daily

---

## 6. Strategy Engine Design

### Model 1: Breakout + Time Exit

**Entry Conditions (all must be true):**
1. Market filter: Nifty50 LTP > EMA50 (bullish market)
2. Sector filter: sector index > its own EMA20
3. Stock: today's high > yesterday's high (breakout candle)
4. Volume: current 5-min volume > 1.5× average 5-min volume
5. RSI(14) on 15-min chart: 55 < RSI < 75 (not overbought)
6. Price > EMA20 on daily chart

**Exit Conditions (evaluated in priority order):**
1. Initial SL: entry_price × (1 - stop_pct) — default 1.5%
2. Target 1: entry_price × (1 + target1_pct) — default 3% → exit 100%
3. Time exit: if position still open at 15:15 IST → market exit

**Indicator Calculation:**
```js
// All computed from in-memory OHLCV buffer
const candles15m = ohlcvBuffer.get(symbol, '15m', 20);
const rsi = indicatorLib.rsi(candles15m.map(c => c.close), 14);
const ema20_daily = indicatorLib.ema(dailyCandles.map(c => c.close), 20);
```

**Signal Object:**
```js
{
  userId, symbol, strategy: 'MODEL1',
  direction: 'LONG',
  quantity: calculateQty(capital, riskPct, entryPrice, slPrice),
  entry_price: ltp + slippage,
  initial_sl: entryPrice * 0.985,
  target_1: entryPrice * 1.03,
  target_2: null,  // MODEL1 has single target
  indicators: { rsi, ema20_daily, breakoutHigh }
}
```

### Model 2: Momentum + Trailing + Partial Booking

**Entry Conditions:**
1. Market filter: same as Model 1
2. MACD(12,26,9): MACD line crossed above Signal line in last 2 candles
3. RSI(14) on 5-min chart: 50 < RSI < 70
4. ATR(14) > 0.5% of price (sufficient volatility)
5. Price > VWAP

**Exit Logic:**
1. Initial SL: entry_price - (1.5 × ATR)
2. **Partial exit (50%):** at target_1 = entry + (2 × ATR)
   - After partial, move SL to breakeven + 0.1%
   - State → PARTIAL_EXIT
3. **Trailing on remainder:**
   - trail_offset = 1 × ATR
   - On every tick: trailing_sl = max(trailing_sl, ltp - trail_offset)
   - State → TRAILING_ACTIVE
4. Exit remainder when: ltp ≤ trailing_sl OR time exit

**Quantity Calculation (both models):**
```js
function calculateQty(capital, riskPct, entryPrice, slPrice) {
  const riskAmount = capital * (riskPct / 100);  // e.g. 1% of 500000 = 5000
  const riskPerShare = entryPrice - slPrice;
  const qty = Math.floor(riskAmount / riskPerShare);
  return Math.max(1, qty);
}
```

### Duplicate Trade Prevention

```js
// Signal validator - Redis atomic operation
async function isDuplicate(userId, symbol, date) {
  const key = `trade:lock:${userId}:${symbol}:${date}`;
  // SET NX returns 1 if set (new), null if already exists (duplicate)
  const result = await redis.set(key, '1', 'NX', 'EX', 86400);
  return result === null;  // true = duplicate
}
```

The key expires at midnight naturally since date is part of the key. No same-day re-entry on the same symbol for the same user.

---

## 7. State Machine

### State Definitions

| State | Meaning | Allowed Transitions |
|---|---|---|
| IDLE | No activity | → SIGNAL_GENERATED |
| SIGNAL_GENERATED | Signal created, risk check pending | → ORDER_PLACED, → IDLE (risk blocked) |
| ORDER_PLACED | Entry order submitted to broker | → POSITION_OPEN, → IDLE (rejected/timeout) |
| POSITION_OPEN | Position live, monitoring active | → PARTIAL_EXIT, → TRAILING_ACTIVE, → EXITED |
| PARTIAL_EXIT | 50% exited at target_1, remainder held | → TRAILING_ACTIVE, → EXITED |
| TRAILING_ACTIVE | Trailing SL active on remainder | → EXITED |
| EXITED | All qty closed, final P&L calculated | (terminal) |

### Transition Rules

```js
class PositionStateMachine {
  
  static TRANSITIONS = {
    SIGNAL_GENERATED: ['ORDER_PLACED', 'IDLE'],
    ORDER_PLACED:     ['POSITION_OPEN', 'IDLE'],
    POSITION_OPEN:    ['PARTIAL_EXIT', 'TRAILING_ACTIVE', 'EXITED'],
    PARTIAL_EXIT:     ['TRAILING_ACTIVE', 'EXITED'],
    TRAILING_ACTIVE:  ['EXITED'],
  };

  transition(position, newState, reason) {
    const allowed = this.TRANSITIONS[position.state];
    if (!allowed?.includes(newState)) {
      throw new InvalidTransitionError(
        `Cannot transition from ${position.state} to ${newState}`
      );
    }
    
    // Append to state_history JSONB
    const historyEntry = {
      from: position.state,
      to: newState,
      ts: new Date().toISOString(),
      reason
    };
    
    return {
      ...position,
      state: newState,
      state_history: [...position.state_history, historyEntry],
      updated_at: new Date()
    };
  }
}
```

### Edge Cases

**Order partially filled:**
- `fill_quantity < requested_quantity`
- If fill_qty >= minimum_viable_qty (user config, default 50% of requested):
  → Proceed with POSITION_OPEN using fill_qty, update quantity in positions table
- If fill_qty < minimum_viable_qty:
  → Place cancel order for remainder, transition to POSITION_OPEN with reduced qty
  → Log warning: partial fill below minimum

**Duplicate order placement (idempotency):**
```js
// Before placing any order:
const lockKey = `order:lock:${positionId}:${orderType}`;
const locked = await redis.set(lockKey, '1', 'NX', 'EX', 30);
if (!locked) {
  logger.warn('Order placement skipped — lock already held', { positionId });
  return; // another worker is already placing this order
}
```

**System restart mid-trade:**
- Position in state ORDER_PLACED: re-enqueue to orderPollQueue on startup
- Position in state POSITION_OPEN or PARTIAL_EXIT: re-subscribe to tick events, resume monitoring
- Position in state TRAILING_ACTIVE: restore trailing_sl from DB, resume monitoring

**Market closed / holiday:**
- RiskService.validateEntry checks: `if (currentTime < 09:20 || currentTime > 15:00) return BLOCKED`
- Time exit job fires at 15:15 for any POSITION_OPEN/PARTIAL_EXIT/TRAILING_ACTIVE states

---

## 8. Background Jobs

All jobs managed by BullMQ using the `cronQueue`. BullMQ persists job definitions in Redis — jobs survive server restart.

### Job: Token Refresh

```js
// Scheduled: '55 5 * * 1-5' (05:55 IST, Mon-Fri)
// Zerodha access tokens expire daily at 06:00 IST

cronQueue.add('kite-token-refresh', {}, {
  repeat: { cron: '55 5 * * 1-5', tz: 'Asia/Kolkata' },
  attempts: 3,
  backoff: { type: 'fixed', delay: 300000 } // 5 min between retries
});

// Worker logic:
async function refreshKiteToken(job) {
  const activeUsers = await brokerRepository.getConnectedUsers();
  for (const user of activeUsers) {
    try {
      // Full OAuth re-flow not required for programmatic accounts
      // API key + stored secret → generate new session
      const session = await kite.generateSession(null, user.apiSecret);
      await tokenRepository.rotate(user.id, session.access_token);
      await redis.set(`kite:token:${user.id}`, session.access_token, 'EX', 86400);
      logger.info('Token refreshed', { userId: user.id });
    } catch (err) {
      logger.error('Token refresh failed', { userId: user.id, err });
      notifService.alertAdmin(`Token refresh failed for user ${user.email}`);
    }
  }
}
```

### Job: Daily Reset

```js
// Scheduled: '0 9 * * 1-5' (09:00 IST, Mon-Fri)
// Purpose: Clear daily state, ensure clean start

async function dailyReset(job) {
  // 1. Clear all duplicate-prevention keys from yesterday
  const pattern = `trade:lock:*:${yesterday}`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
  
  // 2. Clear circuit breaker counters
  const cbKeys = await redis.keys('risk:consecutive_failures:*');
  if (cbKeys.length > 0) await redis.del(...cbKeys);
  
  // 3. Clear symbol cooldown keys (should be expired but explicit cleanup)
  const cooldownKeys = await redis.keys('risk:cooldown:*');
  if (cooldownKeys.length > 0) await redis.del(...cooldownKeys);
  
  // 4. Verify no positions left in non-terminal state from previous day
  const stuckPositions = await positionRepository.getStuckPositions();
  for (const pos of stuckPositions) {
    logger.error('Position stuck from previous day', { positionId: pos.id });
    notifService.alertAdmin(`Stuck position detected: ${pos.id}`);
  }
  
  // 5. Re-subscribe KiteTicker to configured instruments
  await marketDataService.resubscribeAll();
  
  // 6. Set system:halted = 0 (unblock trading)
  await redis.set('system:halted', '0');
}
```

### Job: Monthly Settlement

```js
// Scheduled: '0 20 28-31 * *' — checks if last trading day of month
// Purpose: Generate monthly P&L report, archive old data

async function monthlySettlement(job) {
  const lastTradingDay = await getLastTradingDayOfMonth();
  if (!isToday(lastTradingDay)) return; // job fires daily, only runs on last trading day
  
  const users = await userRepository.getActiveTraders();
  for (const user of users) {
    const monthlyStats = await analyticsService.computeMonthlyStats(user.id, currentMonth);
    await analyticsRepository.insertMonthlyReport(user.id, monthlyStats);
    notifService.sendMonthlyReport(user.id, monthlyStats);
  }
  
  // Archive trades older than 6 months to cold storage table
  await tradeRepository.archiveOldTrades(6);
}
```

### Job: Commission Calculation

```js
// Triggered by logQueue after every trade exit (NOT a cron — event-driven)
// Zerodha fee structure (as of 2024):

function calculateCharges(trade) {
  const turnover = trade.entry_price * trade.quantity + trade.exit_price * trade.quantity;
  const brokerage = Math.min(20, turnover * 0.0003 * 2);  // ₹20 or 0.03%, both legs, capped ₹20
  const stt = trade.exit_price * trade.quantity * 0.001;   // 0.1% on sell side (MIS)
  const exchangeCharges = turnover * 0.0000345;            // NSE charges
  const gst = (brokerage + exchangeCharges) * 0.18;
  const sebi = turnover * 0.000001;
  const stampDuty = trade.entry_price * trade.quantity * 0.00003; // 0.003% on buy
  
  return {
    brokerage: round2(brokerage),
    stt: round2(stt),
    exchange_charges: round2(exchangeCharges),
    gst: round2(gst),
    sebi_charges: round2(sebi),
    stamp_duty: round2(stampDuty),
    total_charges: round2(brokerage + stt + exchangeCharges + gst + sebi + stampDuty)
  };
}
```

---

## 9. Fault Tolerance & Recovery

### WebSocket Disconnect (KiteTicker)

```js
ticker.on('disconnect', async (error) => {
  logger.warn('KiteTicker disconnected', { error });
  
  // 1. Pause entry engine — no new signals while disconnected
  await redis.set('system:ticker_down', '1', 'EX', 300);
  notifService.broadcastToAll({ type: 'SYSTEM_STATUS', status: 'TICKER_DOWN' });
  
  // 2. Exit engine CONTINUES using last known prices (stale data)
  //    SL checks deferred — avoid false exits on stale ticks
  //    TIME exit still fires at 15:15 via BullMQ cron regardless
  
  // 3. Reconnect with exponential backoff
  let attempt = 0;
  const delays = [1000, 2000, 4000, 8000, 16000, 30000, 60000];
  
  while (attempt < 7) {
    await sleep(delays[attempt]);
    try {
      await ticker.connect();
      await ticker.subscribe(allTokens);
      await redis.del('system:ticker_down');
      notifService.broadcastToAll({ type: 'SYSTEM_STATUS', status: 'TICKER_ONLINE' });
      return;
    } catch (e) {
      attempt++;
    }
  }
  
  // After 7 attempts: alert admin, force close all open positions
  notifService.alertAdmin('KiteTicker reconnect failed after 7 attempts — closing all positions');
  await positionManager.emergencyCloseAll();
});
```

### Order Failure Recovery

**Idempotency strategy:**
- Every `placeOrder` call first acquires a Redis lock: `order:lock:{positionId}:{orderType}`
- Lock TTL: 30 seconds
- If lock cannot be acquired: skip (order already in flight)
- On retry: check if order_id already exists in DB for this positionId+orderType before placing

```js
async function placeOrderIdempotent(positionId, orderType, payload) {
  // Check if order already placed for this position+type
  const existing = await orderRepository.findByPositionAndType(positionId, orderType);
  if (existing && ['PENDING', 'OPEN', 'FILLED'].includes(existing.status)) {
    logger.info('Order already exists, skipping', { positionId, orderType });
    return existing.broker_order_id;
  }
  
  const lock = await redis.set(`order:lock:${positionId}:${orderType}`, '1', 'NX', 'EX', 30);
  if (!lock) throw new Error('Order lock not acquired');
  
  try {
    return await placeOrderImpl(positionId, payload);
  } finally {
    await redis.del(`order:lock:${positionId}:${orderType}`);
  }
}
```

### System Restart Recovery

```js
// startup.js — runs on every process start BEFORE accepting requests

async function recoverState() {
  const restartFlag = await redis.get('system:restart_flag');
  if (!restartFlag) return; // cold start
  
  logger.info('Warm restart detected — recovering state');
  
  // 1. Re-enqueue any ORDER_PLACED positions to orderPollQueue
  const placedOrders = await positionRepository.getByState('ORDER_PLACED');
  for (const pos of placedOrders) {
    const order = await orderRepository.getLatestForPosition(pos.id);
    await orderPollQueue.add({ orderId: order.broker_order_id, positionId: pos.id });
  }
  
  // 2. Resume monitoring for open positions
  const openPositions = await positionRepository.getByStates([
    'POSITION_OPEN', 'PARTIAL_EXIT', 'TRAILING_ACTIVE'
  ]);
  for (const pos of openPositions) {
    positionMonitor.startMonitoring(pos);
  }
  
  // 3. Clear restart flag
  await redis.del('system:restart_flag');
  logger.info(`Recovered ${openPositions.length} open positions`);
}
```

### Graceful Shutdown

```js
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — graceful shutdown starting');
  
  // 1. Stop accepting new signals
  await redis.set('system:halted', '1');
  
  // 2. Wait for in-flight ORDER_PLACED positions to resolve (max 30s)
  await waitForOrdersToSettle(30000);
  
  // 3. Persist all open position states to DB
  await positionRepository.flushAllToDB();
  
  // 4. Set restart flag for warm recovery
  await redis.set('system:restart_flag', '1', 'EX', 86400);
  
  // 5. Pause BullMQ queues (preserves jobs in Redis)
  await Promise.all(queues.map(q => q.pause()));
  
  // 6. Close ticker and WS connections gracefully
  ticker.disconnect();
  wsServer.close();
  
  // 7. Close DB pool
  await pool.end();
  
  process.exit(0);
});
```

---

## 10. Scaling Strategy

### Horizontal Scaling (if needed)

The modular monolith is designed to scale vertically first. A single Node.js process on a 4-core, 16GB machine handles:
- 500 subscribed symbols
- 50 concurrent users
- 10,000 ticks/second

**If this ceiling is hit, extraction path:**

1. **Extract Market Data Service** as a standalone process
   - Runs KiteTicker, publishes ticks to Redis Pub/Sub channel `ticks:{symbol}`
   - All other services subscribe via Redis — no direct EventEmitter coupling
   - Can run on a separate machine with full network bandwidth for WS

2. **Extract Strategy Engine** as a BullMQ worker pool
   - Each tick event publishes to `strategyQueue`
   - Multiple worker processes consume and evaluate — horizontal scale
   - Stateless workers read candles from Redis

3. **Keep Order Execution + Position Manager together** on one process
   - These MUST be sequential per user — no benefit to parallelism
   - Use BullMQ named queues with concurrency=1 per userId

### Database Scaling

- **Primary + read replica**: Position monitoring reads go to replica. All writes to primary.
- **Connection pooling**: PgBouncer in transaction mode — 10 app connections serve 100+ concurrent queries
- **Table partitioning**: `trades` and `logs` partitioned by date — queries always hit one partition
- **Indexes**: Covering indexes on hot query paths (positions by user+state, orders by status)
- **VACUUM tuning**: `autovacuum_vacuum_scale_factor = 0.01` for high-update tables (positions)

### Redis Scaling

- Redis Cluster not needed at current scale — single Redis instance with AOF persistence
- Separate Redis databases: DB 0 = session/token data, DB 1 = market state, DB 2 = BullMQ
- `maxmemory-policy: allkeys-lru` — Redis evicts LRU keys if memory limit hit (non-critical cache data only; critical data like positions state are written to DB first)

---

## 11. Security Design

### JWT Handling

- **Algorithm:** RS256 (asymmetric). Private key (PEM) in environment variable only. Public key checked into repository for verification.
- **Access token TTL:** 15 minutes. Short TTL limits window if token is leaked.
- **Refresh token:** Opaque 256-bit hex. Stored in Redis. One refresh token per user (rotation on use).
- **Token in transport:** Authorization header only (`Bearer {token}`). Never in URL query string. Never in cookies without `HttpOnly` + `Secure` + `SameSite=Strict`.

### API Protection

```js
// Auth middleware (applied to all /api/* routes except /auth/login, /auth/register)
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Rate Limiting

```js
// Using express-rate-limit + Redis store (rate-limit-redis)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                      // 10 login attempts per IP per 15 min
  store: new RedisStore({ client: redis }),
  message: { error: 'Too many login attempts' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 300,                     // 300 requests per minute per user
  keyGenerator: (req) => req.user?.userId || req.ip,
  store: new RedisStore({ client: redis })
});

app.use('/api/auth/login', authLimiter);
app.use('/api', authenticate, apiLimiter);
```

### Sensitive Data

- **Zerodha API Secret:** AES-256-GCM encrypted with key derived from server environment variable. Decrypted in-memory only when needed, never logged.
- **Access tokens:** Stored encrypted in `access_tokens` table. Redis stores plaintext (in-memory cache, TTL 24h). Redis must have AUTH password + bind to localhost only.
- **DB credentials:** Environment variables only. Never in code or config files.
- **Logging:** `metadata` JSONB in logs table strips any field matching `/token|secret|password|key/i` before insert.

---

## 12. API Design

### Auth Endpoints

```
POST /api/auth/register
Body: { email: string, password: string, fullName: string }
Response 201: { userId, email, message: "Registered successfully" }
Response 400: { error: "Email already exists" }

POST /api/auth/login
Body: { email: string, password: string }
Response 200: { accessToken: string, refreshToken: string, expiresIn: 900, user: { id, email, role } }
Response 401: { error: "Invalid credentials" }

POST /api/auth/refresh
Body: { refreshToken: string }
Response 200: { accessToken: string, refreshToken: string, expiresIn: 900 }
Response 401: { error: "Invalid or expired refresh token" }

POST /api/auth/logout
Headers: Authorization: Bearer {token}
Body: { refreshToken: string }
Response 200: { message: "Logged out" }

GET /api/auth/me
Headers: Authorization: Bearer {token}
Response 200: { id, email, fullName, role, createdAt }
```

### Broker Endpoints

```
GET /api/broker/login-url
Headers: Authorization: Bearer {token}
Response 200: { loginUrl: "https://kite.zerodha.com/connect/login?api_key=..." }

GET /api/broker/callback?request_token=xxx
Response 302: Redirect to frontend /dashboard?broker_connected=true
Response 500: { error: "Session generation failed" }

GET /api/broker/status
Response 200: { connected: bool, clientId: string, connectedAt: string | null }

DELETE /api/broker/disconnect
Response 200: { message: "Broker disconnected" }
```

### Market Data Endpoints

```
GET /api/market/instruments?exchange=NSE
Response 200: { instruments: [{ symbol, tradingSymbol, token, exchange }] }

GET /api/market/quote/:symbol
Response 200: { symbol, ltp, open, high, low, close, volume, timestamp }

GET /api/market/ohlcv/:symbol?timeframe=1m&limit=100
Response 200: { symbol, timeframe, candles: [{ timestamp, open, high, low, close, volume }] }
```

### Order Endpoints

```
GET /api/orders?status=PENDING&limit=50&offset=0
Response 200: {
  total: number,
  orders: [{
    id, positionId, brokerOrderId, orderType, transactionType,
    quantity, requestedPrice, fillPrice, fillQuantity, status, placedAt, filledAt
  }]
}

GET /api/orders/:orderId
Response 200: { ...full order object }

POST /api/orders/:orderId/cancel
Response 200: { message: "Cancel request submitted" }
Response 400: { error: "Order cannot be cancelled in current status" }
```

### Position Endpoints

```
GET /api/positions?state=POSITION_OPEN
Response 200: {
  positions: [{
    id, symbol, state, direction, quantity, remainingQty,
    entryPrice, currentSl, target1, target2, trailingSl,
    unrealizedPnl, entryTime, strategyName
  }]
}

GET /api/positions/:id
Response 200: { ...full position with stateHistory, associated orders }

POST /api/positions/:id/exit
Body: { reason: "MANUAL" }
Response 200: { message: "Exit order placed", orderId: string }
Response 400: { error: "Position cannot be manually exited in state EXITED" }

GET /api/positions/:id/pnl
Response 200: {
  positionId, symbol, entryPrice, currentLtp, unrealizedPnl,
  unrealizedPnlPct, estimatedCharges, netUnrealizedPnl
}
```

### Analytics Endpoints

```
GET /api/analytics/daily?from=2024-01-01&to=2024-01-31
Response 200: {
  summary: { totalTrades, winRate, netPnl, totalCharges },
  daily: [{ date, trades, wins, grossPnl, netPnl }]
}

GET /api/analytics/trades?from=2024-01-01&limit=100&offset=0
Response 200: {
  total: number,
  trades: [{ id, symbol, direction, entryPrice, exitPrice, qty, netPnl, exitReason, entryTime, exitTime }]
}

GET /api/analytics/performance
Response 200: {
  winRate, avgWin, avgLoss, profitFactor, maxDrawdown,
  sharpeRatio, totalTrades, bestDay, worstDay
}
```

### WebSocket Connection

```
WS ws://server/api/ws
Headers: Authorization: Bearer {token}  (or ?token= query param)

Client → Server messages:
{ type: "SUBSCRIBE_SYMBOL", symbol: "RELIANCE" }
{ type: "UNSUBSCRIBE_SYMBOL", symbol: "RELIANCE" }
{ type: "PING" }

Server → Client messages:
{ type: "TICK_UPDATE", symbol: "RELIANCE", ltp: 2840.50, change: 0.35 }
{ type: "POSITION_UPDATE", positionId: "...", state: "POSITION_OPEN", unrealizedPnl: 1250 }
{ type: "ORDER_UPDATE", orderId: "...", status: "FILLED", fillPrice: 2841.00 }
{ type: "ALERT_SIGNAL", signal: { symbol, strategy, direction, entryPrice } }
{ type: "ALERT_ERROR", message: "Order rejected: RMS limit exceeded" }
{ type: "SYSTEM_STATUS", status: "TICKER_DOWN" | "TICKER_ONLINE" | "SYSTEM_HALTED" }
{ type: "DAILY_SUMMARY", netPnl, trades, winRate }
{ type: "PONG" }
```

---

## 13. Testing Strategy

### Unit Tests (Jest)

**What to unit test:**
- `indicator.lib.js` — EMA, RSI, MACD, ATR calculations with known input/output
- `position.machine.js` — all valid + invalid state transitions
- `slippage.calculator.js` — price computation
- `commission.calculator.js` — charge calculations with real Zerodha fee examples
- `risk.service.js` — each risk check in isolation with mocked dependencies
- `signal.validator.js` — duplicate detection logic with mocked Redis

```js
// Example: state machine unit test
describe('PositionStateMachine', () => {
  it('should transition SIGNAL_GENERATED → ORDER_PLACED', () => {
    const position = createPosition({ state: 'SIGNAL_GENERATED' });
    const updated = machine.transition(position, 'ORDER_PLACED', 'order_placed');
    expect(updated.state).toBe('ORDER_PLACED');
    expect(updated.state_history).toHaveLength(1);
  });

  it('should throw on invalid transition', () => {
    const position = createPosition({ state: 'POSITION_OPEN' });
    expect(() => machine.transition(position, 'SIGNAL_GENERATED', 'test'))
      .toThrow(InvalidTransitionError);
  });
});
```

### Integration Tests

**Test against real PostgreSQL + Redis (Docker Compose):**
- Full auth flow: register → login → refresh → logout
- Broker callback: mock Kite API, test token storage + Redis cache
- Order placement: mock kite.placeOrder, verify DB writes and queue jobs
- Position lifecycle: drive full SIGNAL_GENERATED → EXITED flow
- Background jobs: verify daily reset clears correct Redis keys

```js
// Integration test setup
beforeAll(async () => {
  db = await createTestPool();
  redis = await createTestRedis();
  await runMigrations(db);
});

afterEach(async () => {
  await db.query('TRUNCATE positions, orders, signals CASCADE');
  await redis.flushdb();
});
```

### Backtesting Simulation

**Design:** Backtesting uses the same strategy code but replaces live data sources with historical data feeds.

```js
// backtest.runner.js
class BacktestRunner {
  constructor(strategy, historicalCandles) {
    this.strategy = strategy;
    this.candles = historicalCandles; // { symbol: Candle[] }
  }

  async run(fromDate, toDate) {
    const results = [];
    
    for (const candle of this.getCandles(fromDate, toDate)) {
      // Simulate tick from candle close
      const fakeTick = { ...candle, ltp: candle.close };
      
      // Feed to strategy (same code path as live)
      const signal = this.strategy.evaluate(fakeTick, this.getHistoricalBuffer(candle));
      
      if (signal) {
        // Simulate order fill at next candle open + slippage
        const fillPrice = this.candles[candle.symbol][candle.index + 1]?.open * 1.0005;
        results.push(this.simulateTrade(signal, fillPrice));
      }
    }
    
    return this.computeStats(results);
  }
}
```

### Paper Trading Mode

- Toggle: `TRADING_MODE=paper` in `.env`
- Paper trading replaces `kite.placeOrder()` with a simulated fill:
  ```js
  async function paperPlaceOrder(payload) {
    const fillPrice = marketDataService.getLastTick(payload.tradingsymbol).ltp;
    // Simulate 200ms fill delay
    await sleep(200);
    return { orderId: `PAPER-${uuid()}`, fillPrice, status: 'COMPLETE' };
  }
  ```
- All other logic (state machine, P&L, risk) runs identically
- Paper trades stored in DB with `is_paper: true` flag (not included in real analytics)

---

## 14. Failure Scenarios

### Scenario 1: Broker API Down

**Trigger:** Zerodha REST API returns 5xx or connection times out during order placement.

**What happens:**
1. `kite.placeOrder()` throws or returns error
2. `OrderExecutionService` catches error
3. Retry logic: 3 attempts with delays [500ms, 1000ms, 2000ms]
4. If all retries fail:
   a. DB: INSERT into orders with status='FAILED'
   b. Position stays in state 'SIGNAL_GENERATED' (not ORDER_PLACED)
   c. `RiskService.recordFailure(userId)` — increments circuit breaker counter
   d. If counter >= 3: `redis.set('system:halted', '1')` — no new trades
   e. WS broadcast: `ALERT_ERROR` → "Order placement failed — trading halted"
   f. Admin notification sent
5. Circuit breaker resets on next daily reset job

**Open positions:** Unaffected — positions already open continue monitoring. Only NEW entries blocked.

### Scenario 2: Redis Down

**Trigger:** Redis connection lost or OOM.

**Impact by feature:**
- **Session/JWT:** Access tokens still verified (JWT is self-contained). Refresh tokens fail (need Redis). Users can still use existing access tokens for up to 15 min.
- **Duplicate prevention:** Cannot acquire Redis lock. Fallback: check DB for existing signal in last 24h before placing. Slower (DB query vs Redis) but safe.
- **Circuit breaker:** Cannot write failure count. Disabled — risk of order spam if broker API is also flaky. Accept this tradeoff.
- **Rate limiting:** Cannot enforce. Fallback: IP-based in-memory rate limiting (less accurate for multi-instance, acceptable).
- **Position state cache:** Falls back to DB for position.state. Higher DB load but positions remain consistent.
- **KiteTicker token:** Cannot load from Redis. Falls back to DB `access_tokens` table query. Slower but functional.

**Recovery:** App automatically reconnects to Redis with exponential backoff. No data loss since Redis is used as a cache layer — DB is the source of truth.

### Scenario 3: DB Slow

**Trigger:** PostgreSQL experiencing high load — queries taking 2s+ instead of <50ms.

**What happens:**
1. Tick processing continues in memory — unaffected (no DB writes in hot path)
2. Signal generation continues — unaffected
3. Order placement: `INSERT INTO orders` blocks → order placement delayed
4. Position state updates: delayed → position.state in Redis diverges from DB temporarily
5. BullMQ jobs start timing out and re-queuing

**Mitigation:**
- Position state written to Redis immediately (fast) and DB asynchronously via logQueue
- If DB write fails 5 times (logQueue retry limit), alert admin — potential state inconsistency
- Read queries (GET positions, analytics) use read replica — isolated from write contention
- Connection pool (PgBouncer): ensures app doesn't exhaust DB connections under load

### Scenario 4: Duplicate Signal

**Trigger:** Two tick events arrive within milliseconds for the same symbol, both triggering entry condition.

**Prevention layers:**
1. **Redis atomic SET NX:** First signal acquires lock `trade:lock:{userId}:{symbol}:{date}`. Second signal finds key exists → returns `isDuplicate = true` → signal discarded.
2. **Synchronous signal validator:** Signal validation is synchronous — second event queued behind first in Node.js event loop. By the time it runs, Redis key is set.
3. **DB unique constraint fallback:** Even if both slip through Redis, the signals table has no unique constraint (signals are logged) but the duplicate check runs before inserting to positions table, which would create an invalid second position for the same symbol.

**Result:** Only one trade per symbol per user per day.

### Scenario 5: Orders Partially Fill

**Trigger:** LIMIT order placed for 100 shares fills only 60 shares before price moves away.

**Detection:**
```js
// In orderPollQueue worker
const order = await kite.getOrderHistory(orderId);
const lastUpdate = order[order.length - 1];

if (lastUpdate.status === 'OPEN' && lastUpdate.filled_quantity > 0) {
  // Partial fill state
}
```

**Handling:**
- Poll continues until order is COMPLETE, REJECTED, or times out (60s)
- If at 60s: `filled_qty` is recorded, `pending_qty` cancelled via `kite.cancelOrder()`
- Position proceeds with `filled_qty`:
  - If `filled_qty >= minimum_viable_qty (configured, e.g. 50% of requested)`: POSITION_OPEN with reduced qty. SL and targets recalculated for actual qty.
  - If `filled_qty < minimum_viable_qty`: cancel remaining, position → IDLE. Log as `PARTIAL_FILL_ABANDONED`.
- P&L calculations always use actual `fill_qty` and `fill_price`, never requested values.

---

## Appendix: Directory Structure

```
zero-thinking-trading/
├── src/
│   ├── app.js                    # Express app setup
│   ├── startup.js                # Boot sequence + state recovery
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   └── token.service.js
│   │   ├── broker/
│   │   │   ├── broker.controller.js
│   │   │   ├── broker.service.js
│   │   │   ├── kite.client.js
│   │   │   └── token.repository.js
│   │   ├── market-data/
│   │   │   ├── ticker.manager.js
│   │   │   ├── tick.processor.js
│   │   │   ├── ohlcv.buffer.js
│   │   │   ├── market.broadcaster.js
│   │   │   └── instrument.registry.js
│   │   ├── strategy/
│   │   │   ├── strategy.registry.js
│   │   │   ├── strategy.runner.js
│   │   │   ├── model1.strategy.js
│   │   │   ├── model2.strategy.js
│   │   │   ├── indicator.lib.js
│   │   │   └── signal.validator.js
│   │   ├── orders/
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.repository.js
│   │   │   ├── order.poller.js
│   │   │   └── slippage.calculator.js
│   │   ├── positions/
│   │   │   ├── position.controller.js
│   │   │   ├── position.machine.js
│   │   │   ├── position.repository.js
│   │   │   ├── position.monitor.js
│   │   │   └── exit.coordinator.js
│   │   ├── risk/
│   │   │   ├── risk.service.js
│   │   │   ├── risk.config.repository.js
│   │   │   └── circuit.breaker.js
│   │   ├── notifications/
│   │   │   ├── ws.server.js
│   │   │   ├── ws.broadcaster.js
│   │   │   └── notification.events.js
│   │   └── analytics/
│   │       ├── analytics.controller.js
│   │       ├── analytics.service.js
│   │       └── analytics.repository.js
│   ├── jobs/
│   │   ├── queues.js             # BullMQ queue definitions
│   │   ├── workers/
│   │   │   ├── order.poll.worker.js
│   │   │   ├── log.worker.js
│   │   │   └── cron.worker.js
│   │   └── scheduled/
│   │       ├── token.refresh.job.js
│   │       ├── daily.reset.job.js
│   │       └── monthly.settlement.job.js
│   ├── shared/
│   │   ├── db.js                 # PostgreSQL pool
│   │   ├── redis.js              # Redis client
│   │   ├── logger.js             # Pino logger
│   │   ├── errors.js             # Custom error classes
│   │   └── middleware/
│   │       ├── auth.middleware.js
│   │       └── rate.limit.js
│   └── config/
│       └── index.js
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_broker_accounts.sql
│   └── ...
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── docker-compose.yml            # PostgreSQL + Redis for development
└── package.json
```

---

## Appendix: Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
TRADING_MODE=live  # or 'paper'

# Auth
JWT_PRIVATE_KEY_PATH=./certs/private.pem
JWT_PUBLIC_KEY_PATH=./certs/public.pem

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/trading_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://:password@localhost:6379/0
REDIS_SESSION_DB=0
REDIS_MARKET_DB=1
REDIS_BULLMQ_DB=2

# Zerodha Kite
KITE_API_KEY=your_api_key
KITE_API_SECRET_ENCRYPTED=aes256gcm_encrypted_secret
KITE_ENCRYPTION_KEY=32_byte_hex_key

# Risk Defaults
MAX_OPEN_POSITIONS=5
CAPITAL_PER_TRADE_PCT=10
DAILY_LOSS_LIMIT_PCT=2

# Notifications
TELEGRAM_BOT_TOKEN=optional
TELEGRAM_CHAT_ID=optional
```
