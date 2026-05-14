import { createWorker } from '../../config/queue.js';
import { reconcileOrdersProcessor } from '../processors/reconcileOrders.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initReconcileOrdersWorker = () => {
  const worker = createWorker(QUEUE_NAMES.RECONCILE_ORDERS, reconcileOrdersProcessor, {
    concurrency: 1,
  });
  logger.info('👷 reconcileOrdersWorker initialized');
  return worker;
};
