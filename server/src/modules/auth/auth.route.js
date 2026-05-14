import { Router } from 'express';
import authController from './auth.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema, changePasswordSchema } from './auth.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refresh);

router.get('/me', protect, authController.getMe);
router.put('/me', protect, validate(updateProfileSchema), authController.updateMe);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

export default router;
