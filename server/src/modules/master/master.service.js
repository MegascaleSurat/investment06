import masterRepository from './master.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

class MasterService {
  // Sectors
  async getAllSectors() {
    return await masterRepository.getAllSectors();
  }

  async createSector(data) {
    const existing = await masterRepository.findSectorByName(data.name);
    if (existing) {
      throw new ApiError(400, 'Sector already exists');
    }
    const sector = await masterRepository.createSector(data);
    logger.info({ module: 'master', action: 'createSector', sectorId: sector.id }, 'Sector created');
    return sector;
  }

  async updateSector(id, data) {
    const sector = await masterRepository.updateSector(id, data);
    if (!sector) {
      throw new ApiError(404, 'Sector not found');
    }
    logger.info({ module: 'master', action: 'updateSector', sectorId: id }, 'Sector updated');
    return sector;
  }

  // Stocks
  async getAllStocks() {
    return await masterRepository.getAllStocks();
  }

  async createStock(data) {
    const existing = await masterRepository.findStockByCode(data.symbol, data.exchange);
    if (existing) {
      throw new ApiError(400, 'Stock with this symbol and exchange already exists');
    }
    const stock = await masterRepository.createStock(data);
    logger.info({ module: 'master', action: 'createStock', stockId: stock.id }, 'Stock added');
    return stock;
  }

  async updateStock(stockCode, data) {
    // Assuming stockCode is symbol:exchange or just symbol (default NSE)
    let [symbol, exchange] = stockCode.split(':');
    exchange = exchange || 'NSE';

    const stock = await masterRepository.updateStock(symbol, exchange, data);
    if (!stock) {
      throw new ApiError(404, 'Stock not found');
    }
    logger.info({ module: 'master', action: 'updateStock', symbol, exchange }, 'Stock updated');
    return stock;
  }

  async bulkImportStocks(stocksList) {
    const result = await masterRepository.bulkUpsertStocks(stocksList);
    logger.info({ module: 'master', action: 'bulkImport', count: result.length }, 'Bulk import successful');
    return { count: result.length };
  }
}

export default new MasterService();
