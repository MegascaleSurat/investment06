import { Router } from 'express';
import userController from './user.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/profile', protect, userController.getProfile);

export default router;
