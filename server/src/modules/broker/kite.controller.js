import kiteService from './kite.service.js';
import ApiResponse from '../../core/response/ApiResponse.js';
import asyncHandler from '../../middleware/asyncHandler.middleware.js';

class KiteController {
  getLoginUrl = asyncHandler(async (req, res) => {
    const url = await kiteService.getLoginUrl(req.user.id);
    res.json(ApiResponse.success({ url }));
  });

  generateSession = asyncHandler(async (req, res) => {
    const data = await kiteService.generateSession(req.user.id, req.body.request_token);
    res.json(ApiResponse.success(data, 'Kite session established successfully'));
  });

  getStatus = asyncHandler(async (req, res) => {
    const data = await kiteService.getSessionStatus(req.user.id);
    res.json(ApiResponse.success(data));
  });

  getProfile = asyncHandler(async (req, res) => {
    const data = await kiteService.getProfile(req.user.id);
    res.json(ApiResponse.success(data));
  });

  getMargins = asyncHandler(async (req, res) => {
    const data = await kiteService.getMargins(req.user.id);
    res.json(ApiResponse.success(data));
  });

  placeOrder = asyncHandler(async (req, res) => {
    const data = await kiteService.placeOrder(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(data, 'Order placed successfully on Kite'));
  });

  modifyOrder = asyncHandler(async (req, res) => {
    const data = await kiteService.modifyOrder(req.user.id, req.params.order_id, req.body);
    res.json(ApiResponse.success(data, 'Order modified successfully on Kite'));
  });

  cancelOrder = asyncHandler(async (req, res) => {
    const data = await kiteService.cancelOrder(req.user.id, req.params.order_id);
    res.json(ApiResponse.success(data, 'Order cancelled successfully on Kite'));
  });

  getOrders = asyncHandler(async (req, res) => {
    const data = await kiteService.getOrders(req.user.id);
    res.json(ApiResponse.success(data, 'Kite orders fetched successfully'));
  });

  getOrderInfo = asyncHandler(async (req, res) => {
    const data = await kiteService.getOrderInfo(req.user.id, req.params.order_id);
    res.json(ApiResponse.success(data, 'Order status fetched successfully'));
  });

  getOrderTrades = asyncHandler(async (req, res) => {
    const data = await kiteService.getOrderTrades(req.user.id, req.params.order_id);
    res.json(ApiResponse.success(data, 'Order trades fetched successfully'));
  });

  getPositions = asyncHandler(async (req, res) => {
    const data = await kiteService.getPositions(req.user.id);
    res.json(ApiResponse.success(data, 'Broker positions fetched successfully'));
  });

  getHoldings = asyncHandler(async (req, res) => {
    const data = await kiteService.getHoldings(req.user.id);
    res.json(ApiResponse.success(data, 'Broker holdings fetched successfully'));
  });

  placeGtt = asyncHandler(async (req, res) => {
    const data = await kiteService.placeGtt(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(data, 'GTT placed successfully on Kite'));
  });

  modifyGtt = asyncHandler(async (req, res) => {
    const data = await kiteService.modifyGtt(req.user.id, req.params.gtt_id, req.body);
    res.json(ApiResponse.success(data, 'GTT modified successfully on Kite'));
  });

  deleteGtt = asyncHandler(async (req, res) => {
    const data = await kiteService.deleteGtt(req.user.id, req.params.gtt_id);
    res.json(ApiResponse.success(data, 'GTT deleted successfully from Kite'));
  });

  getGtts = asyncHandler(async (req, res) => {
    const data = await kiteService.getGtts(req.user.id);
    res.json(ApiResponse.success(data, 'Kite GTT orders fetched successfully'));
  });

  getOrderHistory = asyncHandler(async (req, res) => {
    const data = await kiteService.getOrderHistory(req.user.id, req.query.days);
    res.json(ApiResponse.success(data, 'Kite order history fetched successfully'));
  });

  calculateMargin = asyncHandler(async (req, res) => {
    const data = await kiteService.calculateMargins(req.user.id, req.body);
    res.json(ApiResponse.success(data, 'Margin calculation completed'));
  });

  placeBasket = asyncHandler(async (req, res) => {
    const data = await kiteService.placeBasketOrders(req.user.id, req.body);
    res.json(ApiResponse.success(data, 'Basket order processing completed'));
  });

  verifySl = asyncHandler(async (req, res) => {
    const data = await kiteService.verifySlTrigger(req.user.id, req.body);
    res.json(ApiResponse.success(data, 'SL trigger verification completed'));
  });
}

export default new KiteController();
