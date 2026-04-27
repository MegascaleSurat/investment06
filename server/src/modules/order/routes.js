const { Router } = require('express');

const orderController = require('./controller');

const router = Router();

router.get('/ping', orderController.ping);

module.exports = { router };

