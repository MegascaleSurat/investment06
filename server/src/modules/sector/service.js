const repository = require('./repository');

async function listSectors() {
  return repository.getAllSectors();
}

async function getSectorStocks(sectorId) {
  return repository.getStocksBySector(sectorId);
}

async function assignSector(stockId, sectorId) {
  return repository.updateStockSector(stockId, sectorId);
}

module.exports = {
  listSectors,
  getSectorStocks,
  assignSector
};
