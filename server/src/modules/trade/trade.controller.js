import tradeService from './trade.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class TradeController {
  getTrades = asyncHandler(async (req, res) => {
    const data = await tradeService.getTrades(req.user.id, req.query);
    res.json(ApiResponse.success(data, 'Trades fetched successfully'));
  });

  getActiveTrades = asyncHandler(async (req, res) => {
    const data = await tradeService.getActiveTrades(req.user.id);
    res.json(ApiResponse.success(data, 'Active positions fetched successfully'));
  });

  getTradeById = asyncHandler(async (req, res) => {
    const data = await tradeService.getTradeDetails(req.params.trade_id, req.user.id);
    res.json(ApiResponse.success(data, 'Trade details fetched successfully'));
  });

  getTradeOrders = asyncHandler(async (req, res) => {
    const data = await tradeService.getTradeOrders(req.params.trade_id, req.user.id);
    res.json(ApiResponse.success(data, 'Trade orders fetched successfully'));
  });

  getTradeLogs = asyncHandler(async (req, res) => {
    const data = await tradeService.getTradeLogs(req.params.trade_id, req.user.id);
    res.json(ApiResponse.success(data, 'Trade logs fetched successfully'));
  });

  manualExit = asyncHandler(async (req, res) => {
    const data = await tradeService.triggerManualExit(req.params.trade_id, req.user.id);
    res.json(ApiResponse.success(data, 'Manual exit triggered successfully'));
  });

  getOrders = asyncHandler(async (req, res) => {
    const data = await tradeService.getAllOrders(req.user.id, req.query);
    res.json(ApiResponse.success(data, 'Orders fetched successfully'));
  });

  checkDuplicate = asyncHandler(async (req, res) => {
    const data = await tradeService.checkDuplicatePosition(req.params.stock_code, req.user.id);
    res.json(ApiResponse.success(data, 'Duplicate check completed'));
  });

  checkCooldown = asyncHandler(async (req, res) => {
    const data = await tradeService.checkCooldown(req.params.stock_code, req.user.id);
    res.json(ApiResponse.success(data, 'Cooldown status fetched successfully'));
  });

  forceState = asyncHandler(async (req, res) => {
    const data = await tradeService.forceState(req.params.trade_id, req.user.id, req.body);
    res.json(ApiResponse.success(data, 'Trade state forced successfully'));
  });
}

export default new TradeController();
