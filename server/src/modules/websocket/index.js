import { Server } from 'socket.io';
import { socketAuth } from './middleware/auth.middleware.js';
import { registerTickerHandler } from './handlers/tickerHandler.js';
import { registerSystemHandler } from './handlers/systemHandler.js';
import { registerTickerCommandHandler } from './handlers/tickerCommandHandler.js';
import { WS_EVENTS } from './constants/events.js';
import logger from '../../config/logger.js';

let io = null;

/**
 * Initialize WebSocket Server
 */
export const initWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling']
  });

  // Apply Authentication Middleware
  io.use(socketAuth);

  // Global connection handler
  io.on(WS_EVENTS.CONNECTION, (socket) => {
    const userId = socket.user.id;
    const roomName = `user:${userId}`;

    logger.info({ 
      socketId: socket.id, 
      userId, 
      handshake: socket.handshake.query 
    }, 'Client connected to WebSocket');

    // Automatically join the user's private room
    socket.join(roomName);
    logger.info({ socketId: socket.id, roomName }, 'Socket joined private room');

    // Handle manual room joins if requested
    socket.on('join', (room) => {
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Socket joined room');
    });

    socket.on(WS_EVENTS.DISCONNECT, (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, 'Client disconnected from WebSocket');
    });

    socket.on(WS_EVENTS.ERROR, (error) => {
      logger.error({ socketId: socket.id, userId, error }, 'Socket error occurred');
    });
  });

  // Register Event Handlers
  registerTickerHandler(io);
  registerSystemHandler();
  registerTickerCommandHandler();

  logger.info('WebSocket Server Initialized');
  return io;
};

/**
 * Get IO Instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
