const { Router } = require('express');
const userController = require('./user.controller');
const { authenticateJWT, requireRole } = require('../../middleware/auth.middleware')
const { validate } = require('../../../middlewares/validate')
const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    listUsersQuerySchema,
    userIdParamsSchema,
    updateUserStatusSchema
} = require('./user.validation')

const router = Router();

// me
router.get('/me', authenticateJWT, userController.me);
router.put('/me', authenticateJWT, validate(updateProfileSchema, 'body'), userController.updateMe);

// change password
router.put(
    '/change-password',
    authenticateJWT,
    validate(changePasswordSchema, 'body'),
    userController.changePassword
);

// login and register
router.post('/register', validate(registerSchema, 'body'), userController.register);
router.post('/login', validate(loginSchema, 'body'), userController.login);

// admin routes
router.get('/', authenticateJWT, requireRole('ADMIN'), validate(listUsersQuerySchema, 'query'), userController.adminList);
router.patch(
    '/:id/status',
    authenticateJWT,
    requireRole('ADMIN'),
    validate(userIdParamsSchema, 'params'),
    validate(updateUserStatusSchema, 'body'),
    userController.adminUpdateStatus
);


module.exports = router;
