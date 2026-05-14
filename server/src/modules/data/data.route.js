import { Router } from 'express';
import dataController from './data.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  getHistoricalSchema, 
  getIntradayCandlesSchema, 
  getVolumeBaselineSchema 
} from './data.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All data routes are protected
router.use(protect);

// Historical & Market Data Endpoints
router.get('/historical/:stock_code', validate(getHistoricalSchema), dataController.getHistoricalDaily);
router.post('/historical/refresh/:stock_code', validate(getHistoricalSchema), dataController.refreshHistoricalDaily);
router.get('/intraday-candles/:stock_code', validate(getIntradayCandlesSchema), dataController.getIntradayCandles);
router.get('/volume-baseline/:stock_code', validate(getVolumeBaselineSchema), dataController.getVolumeBaseline);
router.get('/live-signals', dataController.getLiveSignals);

export default router;
