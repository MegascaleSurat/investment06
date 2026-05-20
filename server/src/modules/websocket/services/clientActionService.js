import { db } from '../../../db/index.js';
import { stocks, stockSymbols, alerts } from '../../../db/schema/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import kiteTickerService from './KiteTickerService.js';
import logger from '../../../config/logger.js';

/**
 * ClientActionService
 * Contains logic for managing stock subscriptions and updating alert seen flags.
 */
class ClientActionService {
  /**
   * Subscribe user to stocks by resolving symbols to Kite tokens
   */
  async subscribeStocks(userId, stockCodes) {
    try {
      logger.info({ userId, stockCodes }, '[ClientActionService] Resolving stock codes for subscription');
      
      const rows = await db
        .select({
          symbol: stocks.symbol,
          kiteToken: stockSymbols.kiteToken
        })
        .from(stocks)
        .innerJoin(stockSymbols, eq(stocks.id, stockSymbols.stockId))
        .where(
          and(
            inArray(stocks.symbol, stockCodes),
            eq(stocks.isActive, true),
            eq(stockSymbols.status, 'ACTIVE')
          )
        );

      const tokens = rows.map((r) => r.kiteToken).filter(Boolean);

      if (tokens.length === 0) {
        logger.warn({ userId, stockCodes }, '[ClientActionService] No active Kite tokens found for stock codes');
        return { success: false, reason: 'No active stock tokens found' };
      }

      // Call KiteTickerService to subscribe
      await kiteTickerService.subscribe(userId, tokens);
      logger.info({ userId, resolvedTokensCount: tokens.length }, '[ClientActionService] Successfully subscribed user');
      
      return { success: true, subscribedTokens: tokens };
    } catch (error) {
      logger.error({ userId, stockCodes, error: error.message }, '[ClientActionService] Error subscribing stocks');
      throw error;
    }
  }

  /**
   * Unsubscribe user from stocks by resolving symbols to Kite tokens
   */
  async unsubscribeStocks(userId, stockCodes) {
    try {
      logger.info({ userId, stockCodes }, '[ClientActionService] Resolving stock codes for unsubscription');

      const rows = await db
        .select({
          symbol: stocks.symbol,
          kiteToken: stockSymbols.kiteToken
        })
        .from(stocks)
        .innerJoin(stockSymbols, eq(stocks.id, stockSymbols.stockId))
        .where(
          and(
            inArray(stocks.symbol, stockCodes)
          )
        );

      const tokens = rows.map((r) => r.kiteToken).filter(Boolean);

      if (tokens.length === 0) {
        logger.warn({ userId, stockCodes }, '[ClientActionService] No tokens found to unsubscribe');
        return { success: false, reason: 'No tokens found' };
      }

      // Call KiteTickerService to unsubscribe
      await kiteTickerService.unsubscribe(userId, tokens);
      logger.info({ userId, resolvedTokensCount: tokens.length }, '[ClientActionService] Successfully unsubscribed user');

      return { success: true, unsubscribedTokens: tokens };
    } catch (error) {
      logger.error({ userId, stockCodes, error: error.message }, '[ClientActionService] Error unsubscribing stocks');
      throw error;
    }
  }

  /**
   * Mark a database alert as seen
   */
  async markAlertSeen(userId, alertId) {
    try {
      logger.info({ userId, alertId }, '[ClientActionService] Marking alert as seen');

      const [updated] = await db
        .update(alerts)
        .set({ seenFlag: true, updatedAt: new Date() })
        .where(
          and(
            eq(alerts.id, alertId),
            eq(alerts.userId, userId)
          )
        )
        .returning();

      if (!updated) {
        logger.warn({ userId, alertId }, '[ClientActionService] Alert not found or not owned by user');
        return { success: false, reason: 'Alert not found' };
      }

      logger.info({ userId, alertId }, '[ClientActionService] Alert marked as seen successfully');
      return { success: true, alert: updated };
    } catch (error) {
      logger.error({ userId, alertId, error: error.message }, '[ClientActionService] Error marking alert as seen');
      throw error;
    }
  }
}

export default new ClientActionService();
