// import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';
import logger from './logger.js';

const defaultOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const createQueue = (name) => {
  logger.warn(`⚠️ Queue ${name} not created: Redis is disabled`);
  return null;
  // return new Queue(name, defaultOptions);
};

export const createWorker = (name, processor, options = {}) => {
  logger.warn(`⚠️ Worker for ${name} not initialized: Redis is disabled`);
  return null;
  /*
  const worker = new Worker(name, processor, {
    ...defaultOptions,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.debug(`✅ Job ${job.id} in queue ${name} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job.id} in queue ${name} failed: ${err.message}`);
  });

  return worker;
  */
};
