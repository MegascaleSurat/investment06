import { KiteTicker } from 'kiteconnect';
import kiteRepository from '../../broker/kite.repository.js';
import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS, TICKER_MODES, WS_EVENTS, SOCKET_EVENTS } from '../constants/events.js';
import logger from '../../../config/logger.js';
import { db } from '../../../db/index.js';
import { stocks, stockSymbols, positions, tradeOrders, notifications } from '../../../db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import maintenanceService from '../../maintenance/maintenance.service.js';
import socketEmitter from '../emitters/user.emitter.js';
import { getIO } from '../index.js';

/**
 * Kite Ticker Service
 * 
 * Manages one KiteTicker connection per user.
 * Tracks subscribed tokens and their modes to prevent duplicate subscriptions
 * and allow intelligent mode upgrades (LTP → FULL when position is taken).
 * Bridges raw Zerodha WebSocket events directly into our Event-Driven Core.
 */
class KiteTickerService {
  constructor() {
    this.tickers = new Map();          // userId → KiteTicker instance
    this.subscriptions = new Map();    // userId → Map<instrumentToken, mode>
    this.tokenToSymbol = new Map();    // instrumentToken → symbol
  }

  // ─────────────────────────────────────────────
  // Connect & Event Initializer
  // ─────────────────────────────────────────────

  async connect(userId) {
    if (this.tickers.has(userId)) return this.tickers.get(userId);

    const [creds, session] = await Promise.all([
      kiteRepository.getCredentials(userId),
      kiteRepository.getSession(userId)
    ]);

    if (!creds || !session) {
      throw new Error(`Kite credentials or session missing for user ${userId}`);
    }

    const ticker = new KiteTicker({
      api_key: creds.apiKey,
      access_token: session.accessToken
    });

    // Configure Auto-Reconnect: reconnect 20 times max, with 5 sec interval
    ticker.autoReconnect(true, 20, 5);

    // 1. Kite connection established (ticker.connect)
    ticker.on('connect', async () => {
      logger.info({ userId }, '[Ticker] Connected to Kite WebSocket');
      
      // Emit internal & socket events
      eventBus.emit(INTERNAL_EVENTS.TICKER_CONNECTED, { userId });
      socketEmitter.toUser(userId, SOCKET_EVENTS.TICKER_STATUS, {
        status: 'connected',
        timestamp: new Date()
      });

      // Triggers instrument subscription for all tracked + invested stocks
      try {
        await this.subscribeTrackedAndInvestedStocks(userId);
      } catch (err) {
        logger.error({ userId, error: err.message }, '[Ticker] Failed to subscribe active stocks on connect');
      }
    });

    // 2. Receive tick array (ticker.ticks)
    ticker.on('ticks', (ticks) => {
      this._handleTicks(userId, ticks);
    });

    // 3. Kite disconnected (ticker.disconnect / close)
    ticker.on('close', async (reason) => {
      logger.warn({ userId, reason }, '[Ticker] Connection closed/disconnected');

      // Create persistent DB notification
      try {
        await db.insert(notifications).values({
          userId,
          title: 'Kite Ticker Disconnected',
          message: `Kite WebSocket connection was disconnected. Reason: ${reason || 'None provided'}`,
          type: 'WARNING',
          isRead: false
        });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to insert disconnect notification');
      }

      // Emit socket and internal updates
      eventBus.emit(INTERNAL_EVENTS.TICKER_DISCONNECTED, { userId, reason });
      socketEmitter.toUser(userId, SOCKET_EVENTS.TICKER_STATUS, {
        status: 'disconnected',
        reason,
        timestamp: new Date()
      });
    });

    // 4. Kite ticker error (ticker.error)
    ticker.on('error', async (error) => {
      logger.error({ userId, error: error?.message }, '[Ticker] Error occurred');

      // Create database warning notification
      try {
        await db.insert(notifications).values({
          userId,
          title: 'Kite Ticker Error',
          message: `Kite WebSocket encountered an error: ${error?.message || 'Unknown error'}`,
          type: 'ERROR',
          isRead: false
        });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to insert error notification');
      }

      eventBus.emit(INTERNAL_EVENTS.TICKER_ERROR, { userId, error: error?.message });
      socketEmitter.toUser(userId, SOCKET_EVENTS.TICKER_STATUS, {
        status: 'error',
        error: error?.message,
        timestamp: new Date()
      });
    });

    // 5. Kite auto-reconnect attempt event (ticker.reconnect / reconnecting)
    ticker.on('reconnecting', (count, interval) => {
      logger.info({ userId, count, interval }, '[Ticker] Auto-reconnecting...');

      eventBus.emit(INTERNAL_EVENTS.TICKER_RECONNECTING, { userId, count, interval });
      socketEmitter.toUser(userId, SOCKET_EVENTS.TICKER_STATUS, {
        status: 'reconnecting',
        count,
        interval,
        timestamp: new Date()
      });
    });

    // 6. Kite gives up reconnecting (ticker.noreconnect)
    ticker.on('noreconnect', async () => {
      logger.error({ userId }, '[Ticker] Permanent failure: Auto-reconnect failed');

      // Insert high-priority system alert notification
      try {
        await db.insert(notifications).values({
          userId,
          title: 'CRITICAL: Kite Connection Failed',
          message: 'Kite WebSocket connection failed permanently. All trading engines have been automatically paused for safety!',
          type: 'ERROR',
          isRead: false
        });
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to insert critical notification');
      }

      // Pause all engines for trade safety
      try {
        await maintenanceService.pauseAllEngines(userId, 'Permanent Kite WebSocket disconnect (noreconnect)');
        logger.warn({ userId }, '[Ticker] Successfully paused all engines due to permanent ticker disconnect');
      } catch (err) {
        logger.error({ userId, error: err.message }, '[Ticker] Failed to pause engines on permanent disconnect');
      }

      eventBus.emit(INTERNAL_EVENTS.TICKER_NORECONNECT, { userId });
      socketEmitter.toUser(userId, SOCKET_EVENTS.TICKER_STATUS, {
        status: 'failed',
        message: 'Kite reconnect failed. Systems paused.',
        timestamp: new Date()
      });
    });

    // 7. Receive real-time order status postbacks (ticker.order_update)
    ticker.on('order_update', async (order) => {
      try {
        const { order_id, status, status_message, transaction_type, tradingsymbol } = order;

        logger.info({
          userId,
          orderId: order_id,
          status,
          symbol: tradingsymbol,
          type: transaction_type
        }, '[Ticker] Order status update postback received');

        // Map status: PENDING, COMPLETE, CANCELLED, REJECTED
        let dbStatus = 'PENDING';
        if (status === 'COMPLETE') {
          dbStatus = 'COMPLETE';
        } else if (status === 'REJECTED') {
          dbStatus = 'REJECTED';
        } else if (status === 'CANCELLED') {
          dbStatus = 'CANCELLED';
        } else if (status === 'OPEN' || status === 'TRIGGER PENDING') {
          dbStatus = 'PENDING';
        }

        // Update database order state machine directly
        const [updatedOrder] = await db.update(tradeOrders)
          .set({
            status: dbStatus,
            filledQuantity: order.filled_quantity || 0,
            updatedAt: new Date()
          })
          .where(eq(tradeOrders.brokerOrderId, order_id))
          .returning();

        if (updatedOrder) {
          const userRoom = `user:${userId}`;
          const io = getIO();

          // Emit order update via Socket.IO
          io.to(userRoom).emit(WS_EVENTS.ORDER_UPDATE, {
            orderId: updatedOrder.id,
            brokerOrderId: order_id,
            symbol: tradingsymbol,
            status: dbStatus,
            transactionType: transaction_type,
            quantity: order.filled_quantity || updatedOrder.quantity,
            price: order.average_price || updatedOrder.price,
            timestamp: new Date()
          });

          // Specific execution socket emits for frontend listeners
          if (dbStatus === 'COMPLETE') {
            socketEmitter.toUser(userId, SOCKET_EVENTS.ORDER_EXECUTED, {
              orderId: updatedOrder.id,
              brokerOrderId: order_id,
              symbol: tradingsymbol,
              quantity: order.filled_quantity || updatedOrder.quantity,
              price: order.average_price || updatedOrder.price,
              timestamp: new Date()
            });
          } else if (dbStatus === 'REJECTED') {
            socketEmitter.toUser(userId, SOCKET_EVENTS.ORDER_FAILED, {
              orderId: updatedOrder.id,
              brokerOrderId: order_id,
              symbol: tradingsymbol,
              reason: status_message || 'Order rejected by exchange',
              timestamp: new Date()
            });
          }
        }

        // Feed internal event bus for strategy/trading execution engine processing
        eventBus.emit(INTERNAL_EVENTS.ORDER_UPDATE_RECEIVED, {
          userId,
          order
        });

      } catch (error) {
        logger.error({ userId, error: error.message }, '[Ticker] Error processing order update');
      }
    });

    ticker.connect();
    this.tickers.set(userId, ticker);
    this.subscriptions.set(userId, new Map());

    return ticker;
  }

  // ─────────────────────────────────────────────
  // Database Loading & Subscriptions
  // ─────────────────────────────────────────────

  /**
   * Load active instruments from Database and Subscribe
   */
  async subscribeTrackedAndInvestedStocks(userId) {
    logger.info({ userId }, '[Ticker] Fetching active stocks from database to subscribe');

    // 1. Get all tracked stocks (with symbols mapped to exchange tokens)
    const trackedStocks = await db.select({
      symbol: stocks.symbol,
      kiteToken: stockSymbols.kiteToken,
      exchangeToken: stocks.exchangeToken
    })
    .from(stocks)
    .leftJoin(stockSymbols, eq(stocks.id, stockSymbols.stockId))
    .where(eq(stocks.isTracked, true));

    // 2. Get all actively invested stocks (with active open positions)
    const openPositions = await db.select({
      symbol: stocks.symbol,
      kiteToken: stockSymbols.kiteToken,
      exchangeToken: stocks.exchangeToken
    })
    .from(positions)
    .innerJoin(stocks, eq(positions.stockId, stocks.id))
    .leftJoin(stockSymbols, eq(stocks.id, stockSymbols.stockId))
    .where(and(
      eq(positions.userId, userId),
      eq(positions.status, 'OPEN')
    ));

    // Populate the token to symbol cache
    trackedStocks.forEach(s => {
      const token = s.kiteToken || (s.exchangeToken ? parseInt(s.exchangeToken, 10) : null);
      if (token && !isNaN(token)) {
        this.tokenToSymbol.set(token, s.symbol);
      }
    });

    openPositions.forEach(p => {
      const token = p.kiteToken || (p.exchangeToken ? parseInt(p.exchangeToken, 10) : null);
      if (token && !isNaN(token)) {
        this.tokenToSymbol.set(token, p.symbol);
      }
    });

    const trackedTokens = [];
    const investedTokens = [];

    // Parse instrument keys / tokens
    trackedStocks.forEach(s => {
      const token = s.kiteToken || (s.exchangeToken ? parseInt(s.exchangeToken, 10) : null);
      if (token && !isNaN(token)) {
        trackedTokens.push(token);
      }
    });

    openPositions.forEach(p => {
      const token = p.kiteToken || (p.exchangeToken ? parseInt(p.exchangeToken, 10) : null);
      if (token && !isNaN(token)) {
        investedTokens.push(token);
      }
    });

    const uniqueTracked = [...new Set(trackedTokens)];
    const uniqueInvested = [...new Set(investedTokens)];

    // If an instrument is active in both, openPositions takes priority (upgrade to FULL mode)
    const filteredTracked = uniqueTracked.filter(t => !uniqueInvested.includes(t));

    logger.info({
      userId,
      trackedCount: filteredTracked.length,
      investedCount: uniqueInvested.length
    }, '[Ticker] Subscribing resolved stocks');

    // Subscribe Tracked Stocks as LTP
    if (filteredTracked.length > 0) {
      await this.subscribe(userId, filteredTracked, TICKER_MODES.LTP);
    }

    // Subscribe Invested Stocks as FULL
    if (uniqueInvested.length > 0) {
      await this.subscribe(userId, uniqueInvested, TICKER_MODES.FULL);
    }
  }

  // ─────────────────────────────────────────────
  // ticker.subscribe
  // ─────────────────────────────────────────────

  async subscribe(userId, tokens, mode = TICKER_MODES.LTP) {
    const ticker = this._getTicker(userId);
    const userSubs = this._getUserSubs(userId);

    const newTokens = tokens.filter(t => !userSubs.has(t));
    if (newTokens.length === 0) {
      logger.debug({ userId, tokens }, '[Ticker] All tokens already subscribed');
      return;
    }

    // Resolve symbols for new tokens to populate tokenToSymbol cache
    try {
      const unmapped = newTokens.filter(t => !this.tokenToSymbol.has(t));
      if (unmapped.length > 0) {
        const rows = await db
          .select({
            symbol: stocks.symbol,
            kiteToken: stockSymbols.kiteToken
          })
          .from(stocks)
          .innerJoin(stockSymbols, eq(stocks.id, stockSymbols.stockId))
          .where(inArray(stockSymbols.kiteToken, unmapped));

        rows.forEach(r => {
          if (r.kiteToken) {
            this.tokenToSymbol.set(r.kiteToken, r.symbol);
          }
        });
      }
    } catch (err) {
      logger.error({ err: err.message }, '[Ticker] Error resolving tokens for cache');
    }

    ticker.subscribe(newTokens);
    ticker.setMode(mode, newTokens);

    newTokens.forEach(t => userSubs.set(t, mode));

    logger.info({ userId, tokens: newTokens, mode }, '[Ticker] Subscribed to instruments');
  }

  // ─────────────────────────────────────────────
  // ticker.unsubscribe
  // ─────────────────────────────────────────────

  unsubscribe(userId, tokens) {
    const ticker = this._getTicker(userId);
    const userSubs = this._getUserSubs(userId);

    const activeTokens = tokens.filter(t => userSubs.has(t));
    if (activeTokens.length === 0) {
      logger.debug({ userId, tokens }, '[Ticker] No active subscriptions found for these tokens');
      return;
    }

    ticker.unsubscribe(activeTokens);
    activeTokens.forEach(t => userSubs.delete(t));

    logger.info({ userId, tokens: activeTokens }, '[Ticker] Unsubscribed from instruments');
  }

  // ─────────────────────────────────────────────
  // ticker.setMode
  // ─────────────────────────────────────────────

  setMode(userId, tokens, mode) {
    const ticker = this._getTicker(userId);
    const userSubs = this._getUserSubs(userId);

    // Only set mode on already-subscribed tokens
    const validTokens = tokens.filter(t => userSubs.has(t));
    if (validTokens.length === 0) {
      logger.warn({ userId, tokens }, '[Ticker] Cannot setMode: tokens not subscribed');
      return;
    }

    ticker.setMode(mode, validTokens);
    validTokens.forEach(t => userSubs.set(t, mode));

    logger.info({ userId, tokens: validTokens, mode }, '[Ticker] Mode updated for instruments');
  }

  // ─────────────────────────────────────────────
  // Reconnect Recovery — re-subscribe all tokens
  // ─────────────────────────────────────────────

  _resubscribeAll(userId, ticker) {
    const userSubs = this.subscriptions.get(userId);
    if (!userSubs || userSubs.size === 0) return;

    // Group tokens by mode for efficient setMode calls
    const byMode = {};
    userSubs.forEach((mode, token) => {
      byMode[mode] = byMode[mode] || [];
      byMode[mode].push(token);
    });

    const allTokens = [...userSubs.keys()];
    ticker.subscribe(allTokens);

    Object.entries(byMode).forEach(([mode, tokens]) => {
      ticker.setMode(mode, tokens);
    });

    logger.info({ userId, count: allTokens.length }, '[Ticker] Resubscribed all tokens after reconnect');
  }

  // ─────────────────────────────────────────────
  // Internal Tick Processor
  // ─────────────────────────────────────────────

  _handleTicks(userId, ticks) {
    ticks.forEach(tick => {
      const normalized = this._normalizeTick(tick);

      // Emit raw tick internally
      eventBus.emit(INTERNAL_EVENTS.MARKET_TICK_RECEIVED, {
        userId,
        tick: normalized
      });

      // Map instrument token to stock symbol for frontend streaming
      const symbol = this.tokenToSymbol.get(normalized.instrument_token);
      if (symbol) {
        eventBus.emit(INTERNAL_EVENTS.STOCK_LTP_UPDATED, {
          userId,
          payload: {
            stockCode: symbol,
            ltp: normalized.last_price,
            volumeRatio: 1.0,
            priceChangePct: normalized.change || 0,
            timestamp: normalized.timestamp || new Date()
          }
        });
      }
    });
  }

  _normalizeTick(tick) {
    return {
      instrument_token: tick.instrument_token,
      last_price: tick.last_price,
      ohlc: tick.ohlc,
      change: tick.change,
      volume: tick.volume,
      depth: tick.depth,         // only populated in FULL mode
      oi: tick.oi,               // only populated in FULL mode
      timestamp: tick.timestamp || new Date()
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  _getTicker(userId) {
    const ticker = this.tickers.get(userId);
    if (!ticker) throw new Error(`[Ticker] Not connected for user ${userId}`);
    return ticker;
  }

  _getUserSubs(userId) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Map());
    }
    return this.subscriptions.get(userId);
  }

  getSubscriptions(userId) {
    const userSubs = this.subscriptions.get(userId);
    if (!userSubs) return [];
    return [...userSubs.entries()].map(([token, mode]) => ({ token, mode }));
  }

  disconnect(userId) {
    const ticker = this.tickers.get(userId);
    if (ticker) {
      ticker.disconnect();
      this.tickers.delete(userId);
      this.subscriptions.delete(userId);
      logger.info({ userId }, '[Ticker] Disconnected and cleaned up');
    }
  }
}

export default new KiteTickerService();
