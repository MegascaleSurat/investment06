import { createWorker } from '../../config/queue.js';
import { fetchIntradayCandlesProcessor } from '../processors/fetchIntradayCandles.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initFetchIntradayCandlesWorker = () => {
  const worker = createWorker(QUEUE_NAMES.FETCH_INTRADAY_CANDLES, fetchIntradayCandlesProcessor, {
    concurrency: 1, // Cron — single execution per cycle
  });
  logger.info('👷 fetchIntradayCandlesWorker initialized');
  return worker;
};
