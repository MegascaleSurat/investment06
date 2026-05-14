import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/events.js';
import logger from '../../../config/logger.js';

/**
 * Service to handle emitting events to sockets
 */
class SocketEmitter {
  constructor() {
    this.io = null;
    this.nsp = null;
  }

  /**
   * Initialize with namespace
   */
  init(io, nsp) {
    this.io = io;
    this.nsp = nsp;
  }

  /**
   * Emit event to a specific user room
   */
  toUser(userId, event, data) {
    if (!this.nsp) return;
    const room = SOCKET_ROOMS.USER(userId);
    this.nsp.to(room).emit(event, data);
    logger.debug({ userId, event, room }, 'Event emitted to user');
  }

  /**
   * Emit event to a specific strategy room
   */
  toStrategy(strategyId, event, data) {
    if (!this.nsp) return;
    const room = SOCKET_ROOMS.STRATEGY(strategyId);
    this.nsp.to(room).emit(event, data);
    logger.debug({ strategyId, event, room }, 'Event emitted to strategy room');
  }

  /**
   * Emit market tick to all subscribers
   */
  broadcastMarketTick(data) {
    if (!this.nsp) return;
    this.nsp.to(SOCKET_ROOMS.MARKET).emit(SOCKET_EVENTS.MARKET_TICK, data);
  }

  /**
   * Generic emit to room
   */
  toRoom(room, event, data) {
    if (!this.nsp) return;
    this.nsp.to(room).emit(event, data);
  }

  /**
   * Broadcast to all connected clients in the namespace
   */
  broadcast(event, data) {
    if (!this.nsp) return;
    this.nsp.emit(event, data);
  }
}

export default new SocketEmitter();
