import { KiteTicker } from 'kiteconnect';
import kiteRepository from '../../broker/kite.repository.js';
import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS, TICKER_MODES } from '../constants/events.js';
import logger from '../../../config/logger.js';

/**
 * Kite Ticker Service
 * 
 * Manages one KiteTicker connection per user.
 * Tracks subscribed tokens and their modes to prevent duplicate subscriptions
 * and allow intelligent mode upgrades (LTP → FULL when position is taken).
 */
class KiteTickerService {
  constructor() {
    this.tickers = new Map();          // userId → KiteTicker instance
    this.subscriptions = new Map();    // userId → Map<instrumentToken, mode>
  }

  // ─────────────────────────────────────────────
  // Connect
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

    ticker.autoReconnect(true, 20, 5);

    ticker.on('connect', () => {
      logger.info({ userId }, '[Ticker] Connected to Kite WebSocket');
      this._resubscribeAll(userId, ticker);
    });

    ticker.on('ticks', (ticks) => {
      this._handleTicks(userId, ticks);
    });

    ticker.on('error', (error) => {
      logger.error({ userId, error: error?.message }, '[Ticker] Error');
    });

    ticker.on('close', (reason) => {
      logger.warn({ userId, reason }, '[Ticker] Connection closed');
    });

    ticker.on('reconnecting', (count, interval) => {
      logger.info({ userId, count, interval }, '[Ticker] Reconnecting...');
    });

    ticker.connect();
    this.tickers.set(userId, ticker);
    this.subscriptions.set(userId, new Map());

    return ticker;
  }

  // ─────────────────────────────────────────────
  // ticker.subscribe
  // ─────────────────────────────────────────────

  subscribe(userId, tokens, mode = TICKER_MODES.LTP) {
    const ticker = this._getTicker(userId);
    const userSubs = this._getUserSubs(userId);

    const newTokens = tokens.filter(t => !userSubs.has(t));
    if (newTokens.length === 0) {
      logger.debug({ userId, tokens }, '[Ticker] All tokens already subscribed');
      return;
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
      eventBus.emit(INTERNAL_EVENTS.MARKET_TICK_RECEIVED, {
        userId,
        tick: this._normalizeTick(tick)
      });
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
