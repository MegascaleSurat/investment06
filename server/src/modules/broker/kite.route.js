import { Router } from 'express';
import kiteController from './kite.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { placeOrderSchema, modifyOrderSchema } from './kite.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/login-url', kiteController.getLoginUrl);
router.post('/session', kiteController.generateSession);
router.get('/status', kiteController.getStatus);
router.get('/profile', kiteController.getProfile);
router.get('/margins', kiteController.getMargins);

// Orders
router.post('/orders/place', validate(placeOrderSchema), kiteController.placeOrder);
router.put('/orders/:order_id', validate(modifyOrderSchema), kiteController.modifyOrder);
router.delete('/orders/:order_id', kiteController.cancelOrder);
router.get('/orders', kiteController.getOrders);
router.get('/orders/:order_id', kiteController.getOrderInfo);
router.get('/orders/:order_id/trades', kiteController.getOrderTrades);

// Positions & Holdings
router.get('/positions', kiteController.getPositions);
router.get('/holdings', kiteController.getHoldings);

// GTT (Good Till Triggered)
router.get('/gtt', kiteController.getGtts);
router.post('/gtt/place', validate(placeGttSchema), kiteController.placeGtt);
router.put('/gtt/:gtt_id', validate(modifyGttSchema), kiteController.modifyGtt);
router.delete('/gtt/:gtt_id', kiteController.deleteGtt);

// Pre-trade & History
router.get('/orders/history', validate(getOrderHistorySchema), kiteController.getOrderHistory);
router.post('/margin/calculate', validate(marginCalcSchema), kiteController.calculateMargin);
router.post('/orders/basket', validate(basketOrderSchema), kiteController.placeBasket);
router.post('/orders/sl-verify', validate(slVerifySchema), kiteController.verifySl);

export default router;
