const { Router } = require('express');

const { authenticateJWT } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const controller = require('./kite.controller');
const { upsertCredentialsSchema } = require('./kite.validation');

const router = Router();

router.post('/credentials', authenticateJWT, validate(upsertCredentialsSchema, 'body'), controller.upsertCredentials);
router.get('/login', authenticateJWT, controller.getLoginUrl);
router.get('/callback', authenticateJWT, controller.handleCallback);
router.get('/profile', authenticateJWT, controller.getProfile);
router.get('/status', authenticateJWT, controller.getStatus);
router.delete('/disconnect', authenticateJWT, controller.disconnect);

module.exports = { router };
