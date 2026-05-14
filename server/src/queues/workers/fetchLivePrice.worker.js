import { createWorker } from '../../config/queue.js';
import { fetchLivePriceProcessor } from '../processors/fetchLivePrice.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initFetchLivePriceWorker = () => {
  const worker = createWorker(QUEUE_NAMES.FETCH_LIVE_PRICE, fetchLivePriceProcessor, {
    concurrency: 1,
    limiter: { max: 1, duration: 55000 }, // Max 1 run per 55s to avoid overlap
  });
  logger.info('👷 fetchLivePriceWorker initialized');
  return worker;
};
