const { Router } = require('express');

const sectorController = require('./controller');

const router = Router();

router.get('/ping', sectorController.ping);

module.exports = { router };

