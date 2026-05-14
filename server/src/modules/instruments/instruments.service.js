import kiteService from '../broker/kite.service.js';
import instrumentsRepository from './instruments.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

class InstrumentsService {
  /**
   * Download and sync NSE instruments from Kite
   */
  async syncInstruments(userId) {
    const kc = await kiteService._getKiteInstance(userId);
    try {
      logger.info({ userId }, 'Fetching instruments from Kite');
      const instruments = await kc.getInstruments(['NSE']);
      
      // Filter for Equity only (optional, based on requirement)
      // For now, sync everything from NSE
      logger.info({ count: instruments.length }, 'Instruments fetched, starting sync');
      
      // We process in chunks to avoid overloading the DB
      const chunkSize = 1000;
      for (let i = 0; i < instruments.length; i += chunkSize) {
        const chunk = instruments.slice(i, i + chunkSize);
        await instrumentsRepository.updateInstruments(chunk);
      }

      logger.info({ userId }, 'Instrument sync completed');
      return { total: instruments.length };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to sync instruments');
      throw new ApiError(500, `Failed to sync instruments: ${error.message}`);
    }
  }

  /**
   * Fetch full market quote for up to 500 instruments
   */
  async getQuote(userId, instruments) {
    const kc = await kiteService._getKiteInstance(userId);
    try {
      // instruments is a comma-separated string or array
      const instrumentList = Array.isArray(instruments) ? instruments : instruments.split(',');
      return await kc.getQuote(instrumentList);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch quote: ${error.message}`);
    }
  }

  /**
   * Fetch LTP only
   */
  async getLTP(userId, instruments) {
    const kc = await kiteService._getKiteInstance(userId);
    try {
      const instrumentList = Array.isArray(instruments) ? instruments : instruments.split(',');
      return await kc.getLTP(instrumentList);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch LTP: ${error.message}`);
    }
  }

  /**
   * Fetch OHLC + LTP
   */
  async getOHLC(userId, instruments) {
    const kc = await kiteService._getKiteInstance(userId);
    try {
      const instrumentList = Array.isArray(instruments) ? instruments : instruments.split(',');
      return await kc.getOHLC(instrumentList);
    } catch (error) {
      throw new ApiError(500, `Failed to fetch OHLC: ${error.message}`);
    }
  }

  /**
   * Fetch historical candles and store them
   */
  async getHistoricalData(userId, instrumentToken, from, to, interval) {
    const kc = await kiteService._getKiteInstance(userId);
    try {
      const candles = await kc.getHistoricalData(instrumentToken, interval, from, to);
      
      // Find the stock associated with this token to store data
      const stock = await instrumentsRepository.getStockByKiteToken(parseInt(instrumentToken));
      
      if (stock) {
        if (interval === 'day') {
          await instrumentsRepository.saveDailyData(stock.stockId, candles);
        } else {
          await instrumentsRepository.saveIntradayData(stock.stockId, candles);
        }
      }

      return candles;
    } catch (error) {
      logger.error({ error: error.message, instrumentToken }, 'Failed to fetch historical data');
      throw new ApiError(500, `Failed to fetch historical data: ${error.message}`);
    }
  }
}

export default new InstrumentsService();
