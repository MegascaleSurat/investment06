import { Router } from 'express';
import analyticsController from './analytics.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  getHistorySchema, 
  alertIdParamSchema, 
  getLogsSchema 
} from './analytics.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All analytics routes are protected
router.use(protect);

// Performance & History
router.get('/performance', analyticsController.getPerformance);
router.get('/trade-history', validate(getHistorySchema), analyticsController.getTradeHistory);

// Alerts (Mounted separately in index but logically here)
router.get('/alerts', analyticsController.getAlerts);
router.patch('/alerts/:alert_id/seen', validate(alertIdParamSchema), analyticsController.markSeen);
router.post('/alerts/mark-all-seen', analyticsController.markAllSeen);

// Logs
router.get('/logs/system', validate(getLogsSchema), analyticsController.getSystemLogs);

export default router;
