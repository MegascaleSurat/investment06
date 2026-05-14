import { createWorker } from '../../config/queue.js';
import { tradeProcessor } from '../processors/trade.processor.js';
import logger from '../../config/logger.js';

export const initTradeWorker = () => {
  const worker = createWorker('trade-execution', tradeProcessor, {
    concurrency: 5,
  });

  logger.info('👷 Trade worker initialized');
  return worker;
};
