import strategyService from './strategy.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class StrategyController {
  getStrategies = asyncHandler(async (req, res) => {
    const data = await strategyService.getAllStrategies();
    res.json(ApiResponse.success(data, 'Strategies fetched successfully'));
  });

  getStrategy = asyncHandler(async (req, res) => {
    const data = await strategyService.getStrategyDetails(req.params.strategy_id);
    res.json(ApiResponse.success(data, 'Strategy details fetched successfully'));
  });

  createStrategy = asyncHandler(async (req, res) => {
    const data = await strategyService.createStrategy(req.body);
    res.status(201).json(ApiResponse.success(data, 'Strategy created successfully'));
  });

  updateStrategy = asyncHandler(async (req, res) => {
    const data = await strategyService.updateStrategy(req.params.strategy_id, req.body);
    res.json(ApiResponse.success(data, 'Strategy updated (version bumped)'));
  });

  activateStrategy = asyncHandler(async (req, res) => {
    const data = await strategyService.activateStrategy(req.params.strategy_id);
    res.json(ApiResponse.success(data, 'Strategy activated for new trades'));
  });

  getVersions = asyncHandler(async (req, res) => {
    const data = await strategyService.getVersionHistory(req.params.strategy_id);
    res.json(ApiResponse.success(data, 'Version history fetched successfully'));
  });
}

export default new StrategyController();
