import { Router } from 'express';
import brokerController from './broker.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { saveBrokerCredentialsSchema, updateBrokerCredentialsSchema } from './broker.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

import kiteRoutes from './kite.route.js';

const router = Router();

router.use(protect);

router.use('/kite', kiteRoutes);

router.post('/credentials', validate(saveBrokerCredentialsSchema), brokerController.saveCredentials);
router.get('/credentials', brokerController.getCredentials);
router.put('/credentials', validate(updateBrokerCredentialsSchema), brokerController.updateCredentials);
router.delete('/credentials', brokerController.deleteCredentials);
router.get('/session-status', brokerController.getSessionStatus);

export default router;
