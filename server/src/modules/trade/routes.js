const { Router } = require('express');

const tradeController = require('./controller');

const router = Router();

router.get('/ping', tradeController.ping);

module.exports = { router };

