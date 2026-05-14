import dataService from './data.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class DataController {
  /**
   * Get last 20 daily candles
   */
  getHistoricalDaily = asyncHandler(async (req, res) => {
    const data = await dataService.getHistoricalDaily(req.params.stock_code);
    res.json(ApiResponse.success(data, 'Historical daily data fetched successfully'));
  });

  /**
   * Refresh historical daily data
   */
  refreshHistoricalDaily = asyncHandler(async (req, res) => {
    // userId from auth middleware (req.user.id)
    const data = await dataService.refreshHistoricalDaily(req.user.id, req.params.stock_code);
    res.json(ApiResponse.success(data, 'Historical data refresh triggered'));
  });

  /**
   * Get intraday candles
   */
  getIntradayCandles = asyncHandler(async (req, res) => {
    const { stock_code } = req.params;
    const { date } = req.query;
    const data = await dataService.getIntradayCandles(stock_code, date);
    res.json(ApiResponse.success(data, 'Intraday candles fetched successfully'));
  });

  /**
   * Get volume baseline
   */
  getVolumeBaseline = asyncHandler(async (req, res) => {
    const data = await dataService.getVolumeBaseline(req.params.stock_code);
    res.json(ApiResponse.success(data, 'Volume baseline fetched successfully'));
  });

  /**
   * Get latest live signals
   */
  getLiveSignals = asyncHandler(async (req, res) => {
    const data = await dataService.getLatestLiveSignals();
    res.json(ApiResponse.success(data, 'Latest live signals fetched successfully'));
  });
}

export default new DataController();
