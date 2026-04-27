const { Router } = require('express');

const marketController = require('./controller');

const router = Router();

router.get('/ping', marketController.ping);

module.exports = { router };

