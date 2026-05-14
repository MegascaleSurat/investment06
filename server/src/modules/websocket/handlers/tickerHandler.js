import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS, WS_EVENTS } from '../constants/events.js';
import logger from '../../../config/logger.js';

/**
 * Ticker Handler
 * Listens for internal market data events and broadcasts them to specific Socket.IO rooms.
 */
export const registerTickerHandler = (io) => {
  // Listen for processed ticks from the Ticker Service
  eventBus.on(INTERNAL_EVENTS.MARKET_TICK_RECEIVED, ({ userId, tick }) => {
    try {
      // Room Pattern: user:{userId}
      const roomName = `user:${userId}`;
      
      // Broadcast to the user's private room
      io.to(roomName).emit(WS_EVENTS.MARKET_TICK, tick);
      
      // Optional: Broadcast to strategy specific rooms if needed
      // io.to(`instrument:${tick.instrument_token}`).emit(WS_EVENTS.MARKET_TICK, tick);

    } catch (error) {
      logger.error({ error: error.message, userId }, 'Error in Ticker Broadcast Handler');
    }
  });

  logger.info('Market Ticker WebSocket handlers registered');
};
