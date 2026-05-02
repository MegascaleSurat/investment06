const { KiteTicker } = require('kiteconnect');
const { logger } = require('../core/logger');

/**
 * TickerService - Manages Zerodha Kite WebSocket connection and subscriptions.
 * Implementation is a singleton to ensure a single WebSocket connection.
 */
class TickerService {
  constructor() {
    this.ticker = null;
    this.isConnected = false;
    this.subscribedTokens = new Set();
    this.io = null;
    this.latestTicks = new Map(); // token -> latest tick
    this.tickBuffer = new Map(); // token -> latest tick for current batch
    this.broadcastInterval = null;
    this.broadcastFrequency = 200; // ms (5 times per second)
  }

  /**
   * Initialize the service with required dependencies
   * @param {Object} params
   * @param {Object} params.io - Socket.IO instance
   */
  init({ io }) {
    if (this.io) {
      logger.warn('TickerService: Already initialized with Socket.IO. Skipping.');
      return;
    }

    this.io = io;

    // Send initial status to newly connected clients
    this.io.on('connection', (socket) => {
      socket.emit('ticker:initial-status', this.getStatus());
    });

    // Start the broadcast timer
    this.startBroadcastTimer();

    logger.info('TickerService: Initialized with Socket.IO and broadcast timer');
  }

  /**
   * Start a timer to broadcast batched ticks at a fixed interval
   */
  startBroadcastTimer() {
    if (this.broadcastInterval) return;

    this.broadcastInterval = setInterval(() => {
      if (this.tickBuffer.size > 0 && this.io) {
        const ticks = Array.from(this.tickBuffer.values());
        this.io.emit('market:ticks', ticks);
        this.tickBuffer.clear();
      }
    }, this.broadcastFrequency);
  }

  /**
   * Establish WebSocket connection with dynamic credentials
   * @param {string} apiKey
   * @param {string} accessToken
   */
  connect(apiKey, accessToken) {
    if (!apiKey || !accessToken) {
      logger.warn('TickerService: Cannot connect without apiKey and accessToken');
      return;
    }

    if (this.ticker) {
      logger.info('TickerService: Existing ticker found. Disconnecting...');
      try {
        this.ticker.disconnect();
      } catch (err) {
        logger.error({ err }, 'TickerService: Error disconnecting existing ticker');
      }
      this.ticker = null;
      this.isConnected = false;
    }

    this.ticker = new KiteTicker({
      api_key: apiKey,
      access_token: accessToken,
    });

    this.ticker.autoReconnect(true, -1, 5);

    this.ticker.on('ticks', this.onTicks.bind(this));
    this.ticker.on('connect', this.onConnect.bind(this));
    this.ticker.on('disconnect', () => {
      this.isConnected = false;
      this.broadcastStatus();
      logger.warn('TickerService: WebSocket disconnected');
    });
    this.ticker.on('reconnect', this.onReconnect.bind(this));
    this.ticker.on('noreconnect', this.onNoReconnect.bind(this));
    this.ticker.on('error', (err) => {
      logger.error({ err }, 'TickerService: WebSocket error');
    });

    logger.info('TickerService: Connecting to Kite WebSocket...');
    this.ticker.connect();
  }

  /**
   * Callback for successful connection
   */
  onConnect() {
    this.isConnected = true;
    this.broadcastStatus();
    logger.info('TickerService: Connected successfully');

    // Resubscribe to all previously registered tokens on reconnection
    if (this.subscribedTokens.size > 0) {
      const tokens = Array.from(this.subscribedTokens);
      this.ticker.subscribe(tokens);
      this.ticker.setMode(this.ticker.modeFull, tokens);
      logger.info({ count: tokens.length }, 'TickerService: Resubscribed tokens after connection');
    }
  }

  /**
   * Callback for incoming market ticks
   * @param {Array} ticks
   */
  onTicks(ticks) {
    if (!ticks || ticks.length === 0) return;

    // Update in-memory maps
    ticks.forEach((tick) => {
      this.latestTicks.set(tick.instrument_token, tick);
      this.tickBuffer.set(tick.instrument_token, tick);
    });
  }

  /**
   * Callback for reconnection attempts
   * @param {number} interval
   * @param {number} attempt
   */
  onReconnect(interval, attempt) {
    logger.info({ interval, attempt }, 'TickerService: Reconnecting...');
  }

  /**
   * Callback when reconnection fails permanently
   */
  onNoReconnect() {
    logger.error('TickerService: Failed to reconnect after all attempts. Terminating process for safety.');
    process.exit(1);
  }

  /**
   * Subscribe to instrument tokens
   * @param {number[]} tokens
   */
  subscribe(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return;

    // Filter out already subscribed tokens
    const newTokens = tokens.filter((t) => !this.subscribedTokens.has(t));
    if (newTokens.length === 0) return;

    // Add to Set
    newTokens.forEach((t) => this.subscribedTokens.add(t));

    // If connected, subscribe immediately
    if (this.isConnected && this.ticker) {
      this.ticker.subscribe(newTokens);
      this.ticker.setMode(this.ticker.modeFull, newTokens);
      logger.info({ count: newTokens.length }, 'TickerService: Subscribed to new tokens');
    }
  }

  /**
   * Unsubscribe from instrument tokens
   * @param {number[]} tokens
   */
  unsubscribe(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return;

    // Filter to only those currently subscribed
    const tokensToRemove = tokens.filter((t) => this.subscribedTokens.has(t));
    if (tokensToRemove.length === 0) return;

    // Remove from Set
    tokensToRemove.forEach((t) => this.subscribedTokens.delete(t));

    // If connected, unsubscribe immediately
    if (this.isConnected && this.ticker) {
      this.ticker.unsubscribe(tokensToRemove);
      logger.info({ count: tokensToRemove.length }, 'TickerService: Unsubscribed from tokens');
    }
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      subscribedCount: this.subscribedTokens.size,
    };
  }

  /**
   * Broadcast status to all connected Socket.IO clients
   */
  broadcastStatus() {
    if (this.io) {
      this.io.emit('ticker:status', this.getStatus());
    }
  }

  /**
   * Get the latest tick for a specific instrument token
   */
  getLatestTick(token) {
    return this.latestTicks.get(token) || null;
  }
}

// Export as singleton
module.exports = new TickerService();
