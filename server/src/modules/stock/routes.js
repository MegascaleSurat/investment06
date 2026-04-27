const { Router } = require('express');

const { validate } = require('../../middlewares/validate');

const stockController = require('./controller');
const {
  createStockSchema,
  getStockBySymbolParamsSchema,
  listStocksQuerySchema
} = require('./validator');

const router = Router();

router.get('/', validate(listStocksQuerySchema, 'query'), stockController.list);
router.post('/', validate(createStockSchema, 'body'), stockController.createStock);
router.get('/:symbol', validate(getStockBySymbolParamsSchema, 'params'), stockController.getBySymbol);

module.exports = { router };
