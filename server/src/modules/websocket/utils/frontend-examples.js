/**
 * Zero-Thinking Trading System
 * Production-Grade Frontend Socket.IO Integration Example
 * 
 * This file illustrates how to connect, authenticate, handle rooms,
 * and listen to all 14 real-time WebSocket events.
 */

import { io } from 'socket.io-client';

const WEBSOCKET_SERVER_URL = 'http://localhost:5000/ws'; // Target the /ws namespace

/**
 * Initialize Socket.IO connection to the trading system
 * @param {string} token - JWT Access Token of the authenticated user
 */
export const initTradingSocket = (token) => {
  const socket = io(WEBSOCKET_SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket'], // Enforce WebSocket transport for performance
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5
  });

  // ─────────────────────────────────────────────
  // Connection Lifecycle Events
  // ─────────────────────────────────────────────

  socket.on('connect', () => {
    console.log('⚡ [WS Client] Connected successfully! Socket ID:', socket.id);
    
    // Once connected, join relevant rooms.
    // The main room is automatically joined by the server ("user:{userId}")
    // But we can join specific strategy or portfolio rooms if needed:
    socket.emit('room:join', 'market');
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ [WS Client] Disconnected from server. Reason:', reason);
    if (reason === 'io server disconnect') {
      // the server force-disconnected us, we need to reconnect manually
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ [WS Client] Connection Error:', error.message);
  });

  socket.on('error', (err) => {
    console.error('❌ [WS Client] Error Event:', err);
  });

  socket.on('room:joined', ({ room }) => {
    console.log('🏠 [WS Client] Room joined successfully:', room);
  });

  socket.on('room:left', ({ room }) => {
    console.log('🏠 [WS Client] Left room:', room);
  });

  // ─────────────────────────────────────────────
  // 14 Real-Time Business Event Listeners
  // ─────────────────────────────────────────────

  // 1. Market Status Broadcast (STRONG / NEUTRAL / WEAK)
  socket.on('market:status', (data) => {
    console.log('📊 [Market Status] updated:', data.status, 'at', data.timestamp);
    // UI: Update dashboard banner or engine status indicator
  });

  // 2. Sector Metrics Update (Ranked Sectors List)
  socket.on('sector:metrics:update', (data) => {
    console.log('📈 [Sector Metrics] received updated ranking:', data.sectors);
    // UI: Re-render ranked sectors list with score/metrics
  });

  // 3. Stock Live Ticker LTP Stream
  socket.on('stock:ltp', (data) => {
    console.log(`⏱️ [LTP Stream] ${data.stockCode} price: ${data.ltp}, change: ${data.priceChangePct}%, vol_ratio: ${data.volumeRatio}`);
    // UI: Update stock row inside watchlists or screens
  });

  // 4. Stock Entry Status Change (WAITING / BLOCKED / READY)
  socket.on('stock:entry_status', (data) => {
    console.log(`🛡️ [Entry Status] Stock ${data.stockCode} flipped status to: ${data.status}. Reason: ${data.reason}`);
    // UI: Flash color border or update action buttons on screen
  });

  // 5. Confirmation Timer Tick (5-min confirmation hold countdown)
  socket.on('stock:confirmation_timer', (data) => {
    console.log(`⏳ [Confirmation Timer] ${data.stockCode} seconds left: ${data.secondsRemaining}`);
    // UI: Update circular countdown timer overlay on stock card
  });

  // 6. BUY Trade Signal Generated
  socket.on('trade:signal', (data) => {
    console.log(`🎯 [TRADE SIGNAL] BUY Signal triggered for ${data.stockCode} at price ${data.entryPrice} via strategy ${data.strategy}`);
    // UI: Show persistent desktop notification or alert box
  });

  // 7. Order State Changes Stream
  socket.on('trade:order_update', (data) => {
    console.log(`📦 [Order State Change] Order ID: ${data.orderId}, Symbol: ${data.symbol}, Status: ${data.status}, Qty: ${data.quantity}, Price: ${data.price}`);
    // UI: Play execution chime, update order book page rows
  });

  // 8. Live Position Performance Updates (emitted every 30s)
  socket.on('trade:position_update', (data) => {
    console.log(`💰 [Position Update] ID: ${data.positionId}, Stock: ${data.stockCode}, PnL: ${data.pnlPct}%, LTP: ${data.currentPrice}, StopLoss: ${data.stopLoss}`);
    // UI: Update portfolio card PnL values dynamically
  });

  // 9. Exit Rule Fired
  socket.on('trade:exit_triggered', (data) => {
    console.warn(`🛑 [EXIT TRIGGERED] Exit rule fired for ${data.stockCode}. Reason: ${data.exitReason}`);
    // UI: Display active banner showing automated exit is in progress
  });

  // 10. Trade Closed Complete
  socket.on('trade:closed', (data) => {
    console.log(`🏁 [TRADE CLOSED] Finalized trade ID: ${data.tradeId} for ${data.stockCode}. Final PnL: ${data.finalPnlPct}%, Exit: ${data.exitReason}`);
    // UI: Pop up trade completion summary modal
  });

  // 11. Alerts (SL Failure, Order Rejection, API errors)
  socket.on('alert:new', (data) => {
    console.error(`🚨 [NEW ALERT] [${data.severity}] ${data.title}: ${data.message}`);
    // UI: Render Toast alert banner on top of screen
  });

  // 12. Volume Signal Update (15-minute slot checks)
  socket.on('volume:signal', (data) => {
    console.log(`🔊 [Volume Signal] ${data.stockCode} Slot Ratio: ${data.slotRatio}, Status: ${data.status}`);
    // UI: Render volume indicator dot on tracked row
  });

  // 13. System Engine Heartbeat (obs status check)
  socket.on('system:engine_heartbeat', (data) => {
    console.log(`💓 [Engine Heartbeat] Engine "${data.engineName}" status is: ${data.status}, last run: ${data.lastRun}`);
    // UI: Update system health check grid
  });

  // 14. Critical System Error
  socket.on('system:error', (data) => {
    console.error(`💥 [CRITICAL SYSTEM ERROR] Source: ${data.source}. Error: ${data.message}`);
    // UI: Block interaction and show offline overlay if broker disconnects or DB timeouts
  });

  return socket;
};

// ─────────────────────────────────────────────
// Frontend-to-Server Event Emitting Helpers
// ─────────────────────────────────────────────

/**
 * 1. Subscribe for live stock LTP updates
 * @param {import('socket.io-client').Socket} socket 
 * @param {string[]} stockCodes 
 */
export const subscribeStocks = (socket, stockCodes) => {
  socket.emit('subscribe:stocks', { stockCodes }, (response) => {
    if (response.success) {
      console.log('✅ Subscription confirmed:', response.message);
    } else {
      console.error('❌ Subscription failed:', response.error, response.details);
    }
  });
};

/**
 * 2. Unsubscribe from live stock LTP updates
 * @param {import('socket.io-client').Socket} socket 
 * @param {string[]} stockCodes 
 */
export const unsubscribeStocks = (socket, stockCodes) => {
  socket.emit('unsubscribe:stocks', { stockCodes }, (response) => {
    if (response.success) {
      console.log('✅ Unsubscription confirmed:', response.message);
    } else {
      console.error('❌ Unsubscription failed:', response.error, response.details);
    }
  });
};

/**
 * 3. Mark alert as seen
 * @param {import('socket.io-client').Socket} socket 
 * @param {string} alertId 
 */
export const markAlertSeen = (socket, alertId) => {
  socket.emit('alerts:mark_seen', { alertId }, (response) => {
    if (response.success) {
      console.log('✅ Alert marked as seen:', response.message);
    } else {
      console.error('❌ Failed to mark alert as seen:', response.error, response.details);
    }
  });
};

/**
 * 4. Custom Application Ping (Keepalive)
 * @param {import('socket.io-client').Socket} socket 
 */
export const sendPing = (socket) => {
  socket.emit('ping', {}, (response) => {
    console.log('🏓 Pong received at:', response.timestamp);
  });
};
