import { Router } from 'express';
import maintenanceController from './maintenance.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  eodTriggerSchema, 
  engineActionSchema 
} from './maintenance.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All maintenance and engine control routes are protected
router.use(protect);

// Maintenance Jobs
router.post('/maintenance/end-of-day', validate(eodTriggerSchema), maintenanceController.triggerEOD);

// Engine Controls
router.post('/engine/pause', validate(engineActionSchema), maintenanceController.pauseEngines);
router.post('/engine/resume', maintenanceController.resumeEngines);
router.get('/engine/status', maintenanceController.getEngineStatus);

export default router;
