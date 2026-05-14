import analyticsRepository from './analytics.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

class AnalyticsService {
  /**
   * Get overall performance metrics
   */
  async getPerformanceStats(userId) {
    return await analyticsRepository.getPerformanceStats(userId);
  }

  /**
   * Get closed trade history
   */
  async getTradeHistory(userId, filters) {
    return await analyticsRepository.getTradeHistory(userId, filters);
  }

  /**
   * Get unread alerts
   */
  async getUnreadAlerts(userId) {
    return await analyticsRepository.getUnreadAlerts(userId);
  }

  /**
   * Mark alert as seen
   */
  async markAlertSeen(alertId, userId) {
    const [updated] = await analyticsRepository.markAlertSeen(alertId, userId);
    if (!updated) {
      throw new ApiError(404, 'Alert not found or already seen');
    }
    return updated;
  }

  /**
   * Mark all seen
   */
  async markAllSeen(userId) {
    return await analyticsRepository.markAllAlertsSeen(userId);
  }

  /**
   * Get system logs for admin
   */
  async getSystemLogs(filters) {
    return await analyticsRepository.getSystemLogs(filters);
  }
}

export default new AnalyticsService();
