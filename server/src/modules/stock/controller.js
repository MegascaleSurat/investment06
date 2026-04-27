const { asyncHandler } = require('../../core/asyncHandler');

const stockService = require('./service');

const createStock = asyncHandler(async (req, res) => {
  const created = await stockService.createStock(req.body);
  res.status(201).json({ data: created });
});

const getBySymbol = asyncHandler(async (req, res) => {
  const stock = await stockService.getStockBySymbol(req.params.symbol);
  res.status(200).json({ data: stock });
});

const list = asyncHandler(async (req, res) => {
  const items = await stockService.listStocks(req.query);
  res.status(200).json({ data: items, meta: { limit: req.query.limit, offset: req.query.offset } });
});

module.exports = { createStock, getBySymbol, list };

