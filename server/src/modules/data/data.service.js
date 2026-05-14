import dataRepository from './data.repository.js';
import instrumentsService from '../instruments/instruments.service.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

class DataService {
  /**
   * Fetch last 20 daily candles
   */
  async getHistoricalDaily(symbol) {
    const stock = await dataRepository.findStockBySymbol(symbol);
    if (!stock) {
      throw new ApiError(404, 'Stock not found');
    }

    const candles = await dataRepository.getDailyCandles(stock.id, 20);
    return candles;
  }

  /**
   * Manual refresh of 20-day candles
   */
  async refreshHistoricalDaily(userId, symbol) {
    const stock = await dataRepository.findStockBySymbol(symbol);
    if (!stock || !stock.instrumentKey) {
      throw new ApiError(404, 'Stock not found or instrument key missing');
    }

    // Calculate dates for last 30 days to be safe (to get 20 trading days)
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    logger.info({ userId, symbol }, 'Triggering manual refresh of historical data');
    
    // reuse instrumentsService logic
    const candles = await instrumentsService.getHistoricalData(
      userId, 
      stock.instrumentKey, 
      fromDate, 
      toDate, 
      'day'
    );

    return { 
      message: 'Historical data refreshed successfully',
      count: candles.length 
    };
  }

  /**
   * Fetch intraday candles for a date
   */
  async getIntradayCandles(symbol, date) {
    const stock = await dataRepository.findStockBySymbol(symbol);
    if (!stock) {
      throw new ApiError(404, 'Stock not found');
    }

    return await dataRepository.getIntradayCandles(stock.id, date);
  }

  /**
   * Fetch volume baseline
   */
  async getVolumeBaseline(symbol) {
    const stock = await dataRepository.findStockBySymbol(symbol);
    if (!stock) {
      throw new ApiError(404, 'Stock not found');
    }

    return await dataRepository.getVolumeBaseline(stock.id);
  }

  /**
   * Fetch latest live signals
   */
  async getLatestLiveSignals() {
    return await dataRepository.getLatestLiveSignals();
  }
}

export default new DataService();
