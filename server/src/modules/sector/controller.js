const { asyncHandler } = require('../../core/asyncHandler');
const service = require('./service');
const { BadRequestError } = require('../../core/errors/httpErrors');

const listSectors = asyncHandler(async (req, res) => {
  const sectors = await service.listSectors();
  res.status(200).json({ data: sectors });
});

const getSectorStocks = asyncHandler(async (req, res) => {
  const { sectorId } = req.params;
  const stocks = await service.getSectorStocks(sectorId);
  res.status(200).json({ data: stocks });
});

const assignSector = asyncHandler(async (req, res) => {
  const { stockId, sectorId } = req.body;
  if (!stockId || !sectorId) throw new BadRequestError('Missing stockId or sectorId');
  
  const updated = await service.assignSector(stockId, sectorId);
  res.status(200).json({ data: updated });
});

module.exports = {
  listSectors,
  getSectorStocks,
  assignSector
};
