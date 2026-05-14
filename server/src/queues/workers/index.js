import { initFetchHistoricalCandlesWorker } from './fetchHistoricalCandles.worker.js';
import { initFetchIntradayCandlesWorker } from './fetchIntradayCandles.worker.js';
import { initFetchLivePriceWorker } from './fetchLivePrice.worker.js';
import { initFetchMarketIndexWorker } from './fetchMarketIndex.worker.js';
import { initSyncKiteInstrumentsWorker } from './syncKiteInstruments.worker.js';
import { initReconcileOrdersWorker } from './reconcileOrders.worker.js';
import logger from '../../config/logger.js';

export const initDataIngestionWorkers = () => {
  try {
    initFetchHistoricalCandlesWorker();
    initFetchIntradayCandlesWorker();
    initFetchLivePriceWorker();
    initFetchMarketIndexWorker();
    initSyncKiteInstrumentsWorker();
    initReconcileOrdersWorker();
    logger.info('🚀 All Data Ingestion workers started successfully');
  } catch (error) {
    logger.error('❌ Failed to start Data Ingestion workers:', error);
  }
};
