import { socketAuth } from '../middleware/auth.middleware.js';
import registerRoomHandlers from '../handlers/room.handler.js';
import socketEmitter from '../emitters/user.emitter.js';
import logger from '../../../config/logger.js';

/**
 * Initialize the /ws namespace
 */
export const initMainNamespace = (io) => {
  const nsp = io.of('/ws');

  // Attach emitter service to this namespace
  socketEmitter.init(io, nsp);

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
