import tradeRepository from './trade.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';
import { db } from '../../db/index.js';

class TradeService {
  /**
   * List all trades with pagination
   */
  async getTrades(userId, filters) {
    return await tradeRepository.getTrades(userId, filters);
  }

  /**
   * Get invested stock screen data
   */
  async getActiveTrades(userId) {
    return await tradeRepository.getActiveTrades(userId);
  }

  /**
   * Get full trade details
   */
  async getTradeDetails(tradeId, userId) {
    const trade = await tradeRepository.getTradeById(tradeId, userId);
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }

    // Include related data
    const [orders, logs] = await Promise.all([
      tradeRepository.getOrdersByTradeId(tradeId),
      tradeRepository.getLogsByTradeId(tradeId)
    ]);

    return { ...trade, orders, logs };
  }

  /**
   * Get orders for a trade
   */
  async getTradeOrders(tradeId, userId) {
    const trade = await tradeRepository.getTradeById(tradeId, userId);
    if (!trade) throw new ApiError(404, 'Trade not found');
    return await tradeRepository.getOrdersByTradeId(tradeId);
  }

  /**
   * Get logs for a trade
   */
  async getTradeLogs(tradeId, userId) {
    const trade = await tradeRepository.getTradeById(tradeId, userId);
    if (!trade) throw new ApiError(404, 'Trade not found');
    return await tradeRepository.getLogsByTradeId(tradeId);
  }

  /**
   * Global orders list
   */
  async getAllOrders(userId, pagination) {
    return await tradeRepository.getAllOrders(userId, pagination);
  }

  /**
   * Trigger manual exit
   */
  async triggerManualExit(tradeId, userId) {
    const trade = await tradeRepository.getTradeById(tradeId, userId);
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }

    if (['EXITED', 'CANCELLED', 'EXIT_TRIGGERED'].includes(trade.status)) {
      throw new ApiError(400, `Cannot exit trade in ${trade.status} state`);
    }

    return await db.transaction(async (tx) => {
      // 1. Update state machine
      await tradeRepository.updateTradeStatus(tradeId, 'EXIT_TRIGGERED', 'Manual exit triggered by user');

      // 2. Add to order queue for the execution engine to pick up
      await tradeRepository.queueOrder({
        tradeId,
        action: 'PLACE',
        priority: 10, // High priority for manual actions
        status: 'PENDING'
      });

      // 3. Log the action
      await tradeRepository.addLog({
        tradeId,
        logType: 'INFO',
        message: 'Manual exit requested by user. Sell order queued.',
        metadata: JSON.stringify({ triggeredBy: 'USER', timestamp: new Date() })
      });

      logger.info({ tradeId, userId }, 'Manual exit triggered and queued');
      return { message: 'Exit order has been queued' };
    });
  }

  /**
   * Check for duplicate active positions
   */
  async checkDuplicatePosition(stockCode, userId) {
    const stock = await tradeRepository.getStockByCode(stockCode);
    if (!stock) throw new ApiError(404, 'Stock not found');

    const hasActive = await tradeRepository.hasActivePosition(userId, stock.id);
    return { stockCode, hasActive };
  }

  /**
   * Check cooldown status
   */
  async checkCooldown(stockCode, userId) {
    const stock = await tradeRepository.getStockByCode(stockCode);
    if (!stock) throw new ApiError(404, 'Stock not found');

    const lastTrade = await tradeRepository.getCooldownStatus(userId, stock.id);
    
    if (!lastTrade || !lastTrade.exitTime) {
      return { cooldownActive: false };
    }

    const cooldownPeriod = 24 * 60 * 60 * 1000; // 1 trading day simplified to 24h
    const expiresAt = new Date(lastTrade.exitTime.getTime() + cooldownPeriod);
    const now = new Date();

    return {
      cooldownActive: now < expiresAt,
      expiresAt: expiresAt.toISOString(),
      lastExitAt: lastTrade.exitTime.toISOString()
    };
  }

  /**
   * Force state override (Admin/Recovery)
   */
  async forceState(tradeId, userId, { state, reason }) {
    const [updated] = await tradeRepository.forceUpdateState(tradeId, userId, state, `Admin Override: ${reason}`);
    
    if (!updated) {
      throw new ApiError(404, 'Trade not found');
    }

    // Log the override
    await tradeRepository.addLog({
      tradeId,
      logType: 'WARNING',
      message: `Force state transition to ${state}`,
      metadata: JSON.stringify({ reason, triggeredBy: 'ADMIN' })
    });

    logger.warn({ tradeId, state, userId }, 'Trade state forced by admin');
    return updated;
  }
}

export default new TradeService();
