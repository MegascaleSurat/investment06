const { Router } = require('express');
const controller = require('./controller');
const { authenticateJWT } = require('../../middlewares/auth');

const router = Router();

router.use(authenticateJWT);

router.get('/', controller.getWatchlists);
router.post('/', controller.createWatchlist);
router.delete('/:watchlistId', controller.deleteWatchlist);

router.post('/:watchlistId/items', controller.addItem);
router.delete('/:watchlistId/items/:symbolId', controller.removeItem);

module.exports = { router };
