const { Router } = require('express');

const { authenticateJWT, requireRole } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');

const controller = require('./user.controller');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
  updateUserStatusSchema
} = require('./user.validation');

const router = Router();

router.post('/register', validate(registerSchema, 'body'), controller.register);
router.post('/login', validate(loginSchema, 'body'), controller.login);

router.get('/me', authenticateJWT, controller.me);
router.put('/me', authenticateJWT, validate(updateProfileSchema, 'body'), controller.updateMe);
router.put(
  '/change-password',
  authenticateJWT,
  validate(changePasswordSchema, 'body'),
  controller.changePassword
);

router.get('/', authenticateJWT, requireRole('ADMIN'), validate(listUsersQuerySchema, 'query'), controller.adminList);
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('ADMIN'),
  validate(userIdParamsSchema, 'params'),
  validate(updateUserStatusSchema, 'body'),
  controller.adminUpdateStatus
);

module.exports = { router };
