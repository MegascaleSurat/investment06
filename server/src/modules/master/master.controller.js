import masterService from './master.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class MasterController {
  // Sectors
  getSectors = asyncHandler(async (req, res) => {
    const data = await masterService.getAllSectors();
    res.json(ApiResponse.success(data, 'Sectors fetched successfully'));
  });

  createSector = asyncHandler(async (req, res) => {
    const data = await masterService.createSector(req.body);
    res.status(201).json(ApiResponse.success(data, 'Sector created successfully'));
  });

  updateSector = asyncHandler(async (req, res) => {
    const data = await masterService.updateSector(req.params.sector_id, req.body);
    res.json(ApiResponse.success(data, 'Sector updated successfully'));
  });

  // Stocks
  getStocks = asyncHandler(async (req, res) => {
    const data = await masterService.getAllStocks();
    res.json(ApiResponse.success(data, 'Stocks fetched successfully'));
  });

  createStock = asyncHandler(async (req, res) => {
    const data = await masterService.createStock(req.body);
    res.status(201).json(ApiResponse.success(data, 'Stock added successfully'));
  });

  updateStock = asyncHandler(async (req, res) => {
    const data = await masterService.updateStock(req.params.stock_code, req.body);
    res.json(ApiResponse.success(data, 'Stock updated successfully'));
  });

  bulkImportStocks = asyncHandler(async (req, res) => {
    const data = await masterService.bulkImportStocks(req.body);
    res.json(ApiResponse.success(data, 'Bulk import completed successfully'));
  });
}

export default new MasterController();
