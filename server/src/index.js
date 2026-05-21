import http from 'http';
import createServer from './server.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { initMarketScheduler } from './schedulers/market.scheduler.js';
import { initTradeWorker } from './queues/workers/trade.worker.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize App
    const app = createServer();
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    initSocket(server);

    // 4. Initialize Workers
    initTradeWorker();

    // 5. Initialize Schedulers
    initMarketScheduler();

    // 6. Start Listening
    server.listen(env.PORT, () => {
      logger.info(`
        🚀 Server is running in ${env.NODE_ENV} mode
        🔊 Listening on port: ${env.PORT}
        🔗 Health Check: http://localhost:${env.PORT}/api/v1/health
      `);
    });

    // Handle Graceful Shutdown
    const gracefulShutdown = () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
