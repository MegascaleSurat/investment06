import watchlistService from './watchlist.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class WatchlistController {
  getWatchlist = asyncHandler(async (req, res) => {
    const data = await watchlistService.getWatchlist(req.user.id);
    res.json(ApiResponse.success(data, 'Watchlist fetched successfully'));
  });

  uploadWatchlist = asyncHandler(async (req, res) => {
    const data = await watchlistService.uploadWatchlist(req.user.id, req.body);
    res.json(ApiResponse.success(data, 'Watchlist upload processed'));
  });

  addStock = asyncHandler(async (req, res) => {
    const data = await watchlistService.addStock(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(data, 'Stock added to watchlist'));
  });

  updateStock = asyncHandler(async (req, res) => {
    const data = await watchlistService.updateStock(req.user.id, req.params.stock_code, req.body);
    res.json(ApiResponse.success(data, 'Watchlist updated successfully'));
  });

  removeStock = asyncHandler(async (req, res) => {
    await watchlistService.removeStock(req.user.id, req.params.stock_code);
    res.json(ApiResponse.success(null, 'Stock removed from watchlist'));
  });
}

export default new WatchlistController();
