/**
 * WebSocket Connection Monitor
 * Tracks connected sockets, rooms, and event throughput for observability.
 */
import logger from '../../../config/logger.js';

class WsMonitor {
  constructor() {
    this.stats = {
      connections: 0,
      disconnections: 0,
      eventsEmitted: 0,
    };
  }

  trackConnection(socketId, userId) {
    this.stats.connections++;
    logger.info({ socketId, userId, totalConnections: this.stats.connections }, '[WS Monitor] Client connected');
  }

  trackDisconnection(socketId, userId) {
    this.stats.disconnections++;
    logger.info({ socketId, userId }, '[WS Monitor] Client disconnected');
  }

  trackEmit(event) {
    this.stats.eventsEmitted++;
    // Can be extended to push to Prometheus/Datadog
  }

  getStats() {
    return this.stats;
  }
}

export default new WsMonitor();
