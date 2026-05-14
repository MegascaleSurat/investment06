import { Router } from 'express';
import strategyController from './strategy.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  createStrategySchema, 
  updateStrategySchema,
  activateVersionSchema 
} from './strategy.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All strategy routes are protected
router.use(protect);

router.get('/', strategyController.getStrategies);
router.post('/', validate(createStrategySchema), strategyController.createStrategy);

router.get('/:strategy_id', strategyController.getStrategy);
router.put('/:strategy_id', validate(updateStrategySchema), strategyController.updateStrategy);

router.post('/:strategy_id/activate', validate(activateVersionSchema), strategyController.activateStrategy);
router.get('/:strategy_id/versions', strategyController.getVersions);

export default router;
