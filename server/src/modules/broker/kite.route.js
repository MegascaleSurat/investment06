import express from 'express';
import kiteController from './kite.controller.js';
import { kiteCallbackSchema } from './kite.validation.js';
import validate from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import instrumentsRoutes from '../instruments/instruments.route.js';

const router = express.Router();

/**
 * All Kite routes are protected (require user login)
 */
router.use(protect);

router.get('/login-url', kiteController.getLoginUrl);
router.post('/callback', validate(kiteCallbackSchema), kiteController.handleCallback);
router.delete('/session', kiteController.invalidateSession);
router.get('/session-status', kiteController.getSessionStatus);
router.get('/profile', kiteController.getProfile);
router.get('/margins', kiteController.getMargins);

/**
 * Instruments & Market Data routes
 */
router.use(instrumentsRoutes);

export default router;
