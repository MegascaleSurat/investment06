import { socketAuth } from '../middleware/auth.middleware.js';
import registerRoomHandlers from '../handlers/room.handler.js';
import socketEmitter from '../emitters/user.emitter.js';
import logger from '../../../config/logger.js';
import { registerTickerHandler } from '../handlers/tickerHandler.js';
import { registerSystemHandler } from '../handlers/systemHandler.js';
import { registerTickerCommandHandler } from '../handlers/tickerCommandHandler.js';
import { registerFrontendHandler } from '../handlers/frontendHandler.js';
import { registerClientActionHandlers } from '../handlers/clientActionHandler.js';
import kiteTickerService from '../services/KiteTickerService.js';

// Global registration flag to prevent duplicate handlers on reload
let handlersRegistered = false;

/**
 * Initialize the /ws namespace
 */
export const initMainNamespace = (io) => {
  const nsp = io.of('/ws');

  // Attach emitter service to this namespace
  socketEmitter.init(io, nsp);

  // Register Ticker and System handlers once
  if (!handlersRegistered) {
    registerTickerHandler(nsp);
    registerSystemHandler();
    registerTickerCommandHandler();
    registerFrontendHandler();
    handlersRegistered = true;
  }

  // Authentication Middleware
  nsp.use(socketAuth);

  nsp.on('connection', (socket) => {
    const { user } = socket;
    
    logger.info({ 
      socketId: socket.id, 
      userId: user.id, 
      email: user.email 
    }, 'Realtime namespace client connected');

    // Auto-join user room
    socket.join(`user:${user.id}`);

    // Register handlers
    registerRoomHandlers(nsp, socket);
    registerClientActionHandlers(socket);

    // Auto-connect Kite Ticker Service for the user
    kiteTickerService.connect(user.id).catch((err) => {
      logger.warn({ userId: user.id, error: err.message }, '[Main Namespace] Could not auto-connect Kite Ticker on socket join');
    });

    // Heartbeat / Health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      logger.info({ 
        socketId: socket.id, 
        userId: user.id, 
        reason 
      }, 'Realtime namespace client disconnected');
      
      // Optionally disconnect ticker if user has no other active socket connections
      // For now, keep ticker alive so background engines continue processing ticks
    });

    socket.on('error', (error) => {
      logger.error({ 
        socketId: socket.id, 
        userId: user.id, 
        error 
      }, 'Socket error');
    });
  });

  return nsp;
};
