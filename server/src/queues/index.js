import { Queue } from 'bullmq';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};

const createQueue = (name) => {
  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions,
  });

  queue.on('error', (err) => {
    logger.error(`❌ Queue [${name}] error:`, err);
  });

  return queue;
};

export const orderExecutionQueue = createQueue('order-execution');
export const strategyEngineQueue = createQueue('strategy-engine');
export const exitEngineQueue = createQueue('exit-engine');
export const historicalFetchQueue = createQueue('historical-fetch');

export default {
  orderExecutionQueue,
  strategyEngineQueue,
  exitEngineQueue,
  historicalFetchQueue,
};
