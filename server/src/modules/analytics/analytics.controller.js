import analyticsService from './analytics.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class AnalyticsController {
  getPerformance = asyncHandler(async (req, res) => {
    const data = await analyticsService.getPerformanceStats(req.user.id);
    res.json(ApiResponse.success(data, 'Performance stats fetched successfully'));
  });

  getTradeHistory = asyncHandler(async (req, res) => {
    const data = await analyticsService.getTradeHistory(req.user.id, req.query);
    res.json(ApiResponse.success(data, 'Trade history fetched successfully'));
  });

  getAlerts = asyncHandler(async (req, res) => {
    const data = await analyticsService.getUnreadAlerts(req.user.id);
    res.json(ApiResponse.success(data, 'Unread alerts fetched successfully'));
  });

  markSeen = asyncHandler(async (req, res) => {
    const data = await analyticsService.markAlertSeen(req.params.alert_id, req.user.id);
    res.json(ApiResponse.success(data, 'Alert marked as seen'));
  });

  markAllSeen = asyncHandler(async (req, res) => {
    const data = await analyticsService.markAllSeen(req.user.id);
    res.json(ApiResponse.success(data, 'All alerts marked as seen'));
  });

  getSystemLogs = asyncHandler(async (req, res) => {
    const data = await analyticsService.getSystemLogs(req.query);
    res.json(ApiResponse.success(data, 'System logs fetched successfully'));
  });
}

export default new AnalyticsController();
