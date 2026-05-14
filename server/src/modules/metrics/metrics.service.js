import metricsRepository from './metrics.repository.js';
import ApiError from '../../core/errors/ApiError.js';

class MetricsService {
  /**
   * Get latest market dashboard metrics
   */
  async getMarketMetrics() {
    const metrics = await metricsRepository.getLatestMarketMetrics();
    if (!metrics) {
      // Return default empty state instead of error for dashboard stability
      return { marketStatus: 'NEUTRAL', isTradingAllowed: true, remarks: 'No metrics available' };
    }
    return metrics;
  }

  /**
   * Get sector leaderboard
   */
  async getSectorMetrics() {
    return await metricsRepository.getSectorMetrics();
  }

  /**
   * Get stock metrics overview
   */
  async getAllStockMetrics() {
    return await metricsRepository.getAllStockMetrics();
  }

  /**
   * Get specific stock metrics
   */
  async getStockMetrics(symbol) {
    const metrics = await metricsRepository.getStockMetricsBySymbol(symbol);
    if (!metrics) {
      throw new ApiError(404, 'Metrics not found for this stock');
    }
    return metrics;
  }

  /**
   * Get data for the Tracked Stock Screen
   */
  async getTrackedStocks() {
    const data = await metricsRepository.getTrackedStocksData();
    
    // Process data to ensure unique symbols (since a stock can have multiple signals)
    // We take the latest signal for each stock
    const seen = new Set();
    const uniqueData = data.filter(item => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    });

    return uniqueData;
  }
}

export default new MetricsService();
