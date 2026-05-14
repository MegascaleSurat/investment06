import { createWorker } from '../../config/queue.js';
import { fetchHistoricalCandlesProcessor } from '../processors/fetchHistoricalCandles.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initFetchHistoricalCandlesWorker = () => {
  const worker = createWorker(QUEUE_NAMES.FETCH_HISTORICAL_CANDLES, fetchHistoricalCandlesProcessor, {
    concurrency: 3, // Process 3 stocks simultaneously
  });
  logger.info('👷 fetchHistoricalCandlesWorker initialized');
  return worker;
};
