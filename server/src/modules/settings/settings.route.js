import { Router } from 'express';
import settingsController from './settings.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  updateRiskSettingsSchema, 
  updateSystemSettingsSchema 
} from './settings.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All settings routes are protected
router.use(protect);

// Risk Settings
router.get('/risk', settingsController.getRiskSettings);
router.put('/risk', validate(updateRiskSettingsSchema), settingsController.updateRiskSettings);

// System Settings
router.get('/system', settingsController.getSystemSettings);
router.put('/system', validate(updateSystemSettingsSchema), settingsController.updateSystemSettings);

export default router;
