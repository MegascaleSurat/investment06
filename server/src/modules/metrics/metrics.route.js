import { Router } from 'express';
import metricsController from './metrics.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { getStockMetricsSchema } from './metrics.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// Dashboard reads are typically protected for authenticated users
router.use(protect);

// Metrics Endpoints
router.get('/market', metricsController.getMarketMetrics);
router.get('/sectors', metricsController.getSectorMetrics);
router.get('/stocks', metricsController.getStockMetricsOverview);
router.get('/stocks/:stock_code', validate(getStockMetricsSchema), metricsController.getStockMetrics);

// Tracked Stocks Screen (Note: This is outside /metrics path in the task description endpoint)
// But I'll handle it within the same module logic
router.get('/tracked-stocks', metricsController.getTrackedStocks);

export default router;
