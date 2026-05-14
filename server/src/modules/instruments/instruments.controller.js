import instrumentsService from './instruments.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class InstrumentsController {
  /**
   * Sync NSE instruments
   */
  syncInstruments = asyncHandler(async (req, res) => {
    const result = await instrumentsService.syncInstruments(req.user.id);
    res.json(ApiResponse.success(result, 'Instruments synced successfully'));
  });

  /**
   * Get full market quote
   */
  getQuote = asyncHandler(async (req, res) => {
    const { instruments } = req.params;
    const result = await instrumentsService.getQuote(req.user.id, instruments);
    res.json(ApiResponse.success(result, 'Quotes fetched successfully'));
  });

  /**
   * Get LTP only
   */
  getLTP = asyncHandler(async (req, res) => {
    const { instruments } = req.params;
    const result = await instrumentsService.getLTP(req.user.id, instruments);
    res.json(ApiResponse.success(result, 'LTP fetched successfully'));
  });

  /**
   * Get OHLC + LTP
   */
  getOHLC = asyncHandler(async (req, res) => {
    const { instruments } = req.params;
    const result = await instrumentsService.getOHLC(req.user.id, instruments);
    res.json(ApiResponse.success(result, 'OHLC fetched successfully'));
  });

  /**
   * Get historical candles
   */
  getHistorical = asyncHandler(async (req, res) => {
    const { instrument_token } = req.params;
    const { from, to, interval } = req.query;
    
    const result = await instrumentsService.getHistoricalData(
      req.user.id,
      instrument_token,
      from,
      to,
      interval
    );
    
    res.json(ApiResponse.success(result, 'Historical data fetched successfully'));
  });
}

export default new InstrumentsController();
