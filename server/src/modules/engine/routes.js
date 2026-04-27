const { Router } = require('express');

const engineController = require('./controller');

const router = Router();

router.get('/ping', engineController.ping);

module.exports = { router };

