import kiteService from './kite.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

class KiteController {
  getLoginUrl = asyncHandler(async (req, res) => {
    const url = await kiteService.getLoginUrl(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Kite login URL generated',
      data: { url }
    });
  });

  handleCallback = asyncHandler(async (req, res) => {
    const { request_token } = req.body;
    const session = await kiteService.generateSession(req.user.id, request_token);
    res.status(200).json({
      success: true,
      message: 'Kite session established successfully',
      data: session
    });
  });

  invalidateSession = asyncHandler(async (req, res) => {
    await kiteService.invalidateSession(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Kite session invalidated'
    });
  });

  getProfile = asyncHandler(async (req, res) => {
    const profile = await kiteService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Kite profile fetched',
      data: profile
    });
  });

  getMargins = asyncHandler(async (req, res) => {
    const margins = await kiteService.getMargins(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Kite margins fetched',
      data: margins
    });
  });

  getSessionStatus = asyncHandler(async (req, res) => {
    const status = await kiteService.getSessionStatus(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Kite session status fetched',
      data: status
    });
  });
}

export default new KiteController();
