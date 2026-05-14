import { Router } from 'express';
import tradeController from './trade.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { 
  getTradesSchema, 
  tradeIdParamSchema, 
  getOrdersSchema 
} from './trade.validation.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

// All trade routes are protected
router.use(protect);

// Trades & Positions
router.get('/', validate(getTradesSchema), tradeController.getTrades);
router.get('/active', tradeController.getActiveTrades);
router.get('/:trade_id', validate(tradeIdParamSchema), tradeController.getTradeById);
router.get('/:trade_id/orders', validate(tradeIdParamSchema), tradeController.getTradeOrders);
router.get('/:trade_id/logs', validate(tradeIdParamSchema), tradeController.getTradeLogs);
router.post('/:trade_id/manual-exit', validate(tradeIdParamSchema), tradeController.manualExit);

// Global Orders
router.get('/orders', validate(getOrdersSchema), tradeController.getOrders);

// Duplicate & Cooldown Checks
router.get('/duplicate-check/:stock_code', validate(stockCodeParamSchema), tradeController.checkDuplicate);
router.get('/cooldown/:stock_code', validate(stockCodeParamSchema), tradeController.checkCooldown);

// Force State Override
router.post('/:trade_id/force-state', validate(forceStateSchema), tradeController.forceState);

export default router;
