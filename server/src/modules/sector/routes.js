const { Router } = require('express');
const controller = require('./controller');
const { authenticateJWT } = require('../../middlewares/auth');

const router = Router();

// Publicly accessible for authenticated users
router.use(authenticateJWT);

router.get('/', controller.listSectors);
router.get('/:sectorId/stocks', controller.getSectorStocks);
router.post('/assign', controller.assignSector);

module.exports = { router };
