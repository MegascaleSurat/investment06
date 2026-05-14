import metricsService from './metrics.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class MetricsController {
  /**
   * Get market status and metrics
   */
  getMarketMetrics = asyncHandler(async (req, res) => {
    const data = await metricsService.getMarketMetrics();
    res.json(ApiResponse.success(data, 'Market metrics fetched successfully'));
  });

  /**
   * Get all sector metrics
   */
  getSectorMetrics = asyncHandler(async (req, res) => {
    const data = await metricsService.getSectorMetrics();
    res.json(ApiResponse.success(data, 'Sector metrics fetched successfully'));
  });

  /**
   * Get all stock metrics
   */
  getStockMetricsOverview = asyncHandler(async (req, res) => {
    const data = await metricsService.getAllStockMetrics();
    res.json(ApiResponse.success(data, 'Stock metrics fetched successfully'));
  });

  /**
   * Get metrics for a specific stock
   */
  getStockMetrics = asyncHandler(async (req, res) => {
    const data = await metricsService.getStockMetrics(req.params.stock_code);
    res.json(ApiResponse.success(data, 'Stock metrics fetched successfully'));
  });

  /**
   * Get tracked stocks screen data
   */
  getTrackedStocks = asyncHandler(async (req, res) => {
    const data = await metricsService.getTrackedStocks();
    res.json(ApiResponse.success(data, 'Tracked stocks fetched successfully'));
  });
}

export default new MetricsController();
