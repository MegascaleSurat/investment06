import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import redis from './config/redis.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startSchedulers } from './schedulers/cron.js';
import logger, { httpLogger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  httpLogger.info({ method: req.method, url: req.url });
  next();
});

// Routes
app.use(router);

// Error handling
app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId || 'anonymous';
  logger.info(`🔌 Socket connected: ${socket.id} (User: ${userId})`);

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Start Server
const start = async () => {
  try {
    await testConnection();
    startSchedulers();

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
  
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await redis.quit();
      logger.info('Redis connection closed.');
      
      // pg pool is managed by db.js, we should close it if needed
      // but pool.end() is usually enough
      logger.info('👋 Goodbye!');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
