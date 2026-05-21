import instrumentsService from './instruments.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

class InstrumentsController {
  downloadInstruments = asyncHandler(async (req, res) => {
    const { exchange } = req.query;
    const result = await instrumentsService.downloadInstruments(req.user.id, exchange);
    res.status(200).json({
      success: true,
      message: `Instruments download complete. ${result.total} instruments processed.`,
      data: result,
    });
  });

  getQuote = asyncHandler(async (req, res) => {
    const data = await instrumentsService.getQuote(req.user.id, req.query.instruments);
    res.status(200).json({
      success: true,
      message: 'Quote fetched successfully',
      data,
    });
  });

  getLtp = asyncHandler(async (req, res) => {
    const data = await instrumentsService.getLtp(req.user.id, req.query.instruments);
    res.status(200).json({
      success: true,
      message: 'LTP fetched successfully',
      data,
    });
  });

  getOhlc = asyncHandler(async (req, res) => {
    const data = await instrumentsService.getOhlc(req.user.id, req.query.instruments);
    res.status(200).json({
      success: true,
      message: 'OHLC fetched successfully',
      data,
    });
  });

  getHistorical = asyncHandler(async (req, res) => {
    const { instrumentToken } = req.params;
    const data = await instrumentsService.getHistorical(req.user.id, instrumentToken, req.query);
    res.status(200).json({
      success: true,
      message: 'Historical data fetched successfully',
      data,
    });
  });
}

export default new InstrumentsController();
