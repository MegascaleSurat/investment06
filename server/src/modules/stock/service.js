const { ConflictError, NotFoundError } = require('../../core/errors/httpErrors');

const stockRepo = require('./repository');

async function createStock(input) {
  const existing = await stockRepo.getStockBySymbol(input.symbol);
  if (existing) throw new ConflictError('Stock already exists', { symbol: input.symbol });

  return stockRepo.createStock(input);
}

async function getStockBySymbol(symbol) {
  const stock = await stockRepo.getStockBySymbol(symbol);
  if (!stock) throw new NotFoundError('Stock not found', { symbol });
  return stock;
}

async function listStocks(filters) {
  return stockRepo.listStocks(filters);
}

module.exports = { createStock, getStockBySymbol, listStocks };

