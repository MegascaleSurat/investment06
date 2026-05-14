import { createWorker } from '../../config/queue.js';
import { fetchMarketIndexProcessor } from '../processors/fetchMarketIndex.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initFetchMarketIndexWorker = () => {
  const worker = createWorker(QUEUE_NAMES.FETCH_MARKET_INDEX, fetchMarketIndexProcessor, {
    concurrency: 1,
  });
  logger.info('👷 fetchMarketIndexWorker initialized');
  return worker;
};
