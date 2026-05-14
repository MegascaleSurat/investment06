import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import logger from './logger.js';
import { env } from './env.js';
import { initMainNamespace } from '../modules/websocket/namespaces/main.namespace.js';

let io;

/**
 * Initialize Socket.IO with Redis Adapter for scaling
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Production settings
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
  });

  // Redis Adapter for Horizontal Scaling
  const pubClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  logger.info({ 
    host: env.REDIS_HOST, 
    port: env.REDIS_PORT 
  }, 'Socket.IO Redis Adapter initialized');

  // Initialize Namespaces
  initMainNamespace(io);

  // Global events
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Generic socket connection');

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Generic socket disconnected');
    });
  });

  return io;
};

/**
 * Get the global IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
