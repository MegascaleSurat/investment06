import http from 'http';
import createServer from './server.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { initMarketScheduler } from './schedulers/market.scheduler.js';
import { initTradeWorker } from './queues/workers/trade.worker.js';
import { initCalcMetricsWorkers, shutdownCalcMetricsWorkers } from './queues/workers/calcMetrics.worker.js';
import { initStrategySignalsWorkers, shutdownStrategySignalsWorkers } from './queues/workers/strategySignals.worker.js';
import { initOrderExecutionWorkers, shutdownOrderExecutionWorkers } from './queues/workers/orderExecution.worker.js';
import { scheduleOrderExecutionCronJobs } from './queues/producers/orderExecution.producer.js';
import { initTradeManagementWorkers, shutdownTradeManagementWorkers } from './queues/workers/tradeManagement.worker.js';
import { scheduleTradeManagementCronJobs } from './queues/producers/tradeManagement.producer.js';
import { initStateMachineWorkers, shutdownStateMachineWorkers } from './queues/workers/stateMachine.worker.js';
import { scheduleStateMachineCronJobs, queueCrashRecoveryJob } from './queues/producers/stateMachine.producer.js';
import { initMaintenanceWorkers, shutdownMaintenanceWorkers } from './queues/workers/maintenance.worker.js';
import { scheduleMaintenanceCronJobs } from './queues/producers/maintenance.producer.js';
import { initAlertNotificationWorkers, shutdownAlertNotificationWorkers } from './queues/workers/alertNotification.worker.js';
import { scheduleAlertNotificationCronJobs } from './queues/producers/alertNotification.producer.js';

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
    initCalcMetricsWorkers();
    initStrategySignalsWorkers();
    initOrderExecutionWorkers();
    initTradeManagementWorkers();
    initStateMachineWorkers();
    initMaintenanceWorkers();
    initAlertNotificationWorkers();

    // 5. Initialize Schedulers
    initMarketScheduler();
    await scheduleOrderExecutionCronJobs();
    await scheduleTradeManagementCronJobs();
    await scheduleStateMachineCronJobs();
    await scheduleMaintenanceCronJobs();
    await scheduleAlertNotificationCronJobs();

    // 6. Run Crash Recovery (Boot Job)
    await queueCrashRecoveryJob();

    // 7. Start Listening
    server.listen(env.PORT, () => {
      logger.info(`
        🚀 Server is running in ${env.NODE_ENV} mode
        🔊 Listening on port: ${env.PORT}
        🔗 Health Check: http://localhost:${env.PORT}/api/v1/health
      `);
    });

    // Handle Graceful Shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      await shutdownCalcMetricsWorkers();
      await shutdownStrategySignalsWorkers();
      await shutdownOrderExecutionWorkers();
      await shutdownTradeManagementWorkers();
      await shutdownStateMachineWorkers();
      await shutdownMaintenanceWorkers();
      await shutdownAlertNotificationWorkers();
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
