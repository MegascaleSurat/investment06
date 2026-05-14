import { createWorker } from '../../config/queue.js';
import { syncKiteInstrumentsProcessor } from '../processors/syncKiteInstruments.processor.js';
import { QUEUE_NAMES } from '../constants/dataIngestion.js';
import logger from '../../config/logger.js';

export const initSyncKiteInstrumentsWorker = () => {
  const worker = createWorker(QUEUE_NAMES.SYNC_KITE_INSTRUMENTS, syncKiteInstrumentsProcessor, {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    }
  });
  logger.info('👷 syncKiteInstrumentsWorker initialized');
  return worker;
};
