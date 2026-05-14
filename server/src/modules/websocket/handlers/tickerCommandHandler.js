import eventBus from '../utils/eventBus.js';
import { INTERNAL_EVENTS } from '../constants/events.js';
import kiteTickerService from '../services/KiteTickerService.js';
import logger from '../../../config/logger.js';

/**
 * Ticker Command Handler
 * Listens for internal subscribe/unsubscribe/setMode events
 * and delegates to KiteTickerService.
 */
export const registerTickerCommandHandler = () => {
  // ticker.subscribe command
  eventBus.on(INTERNAL_EVENTS.TICKER_SUBSCRIBE, ({ userId, tokens, mode }) => {
    try {
      kiteTickerService.subscribe(userId, tokens, mode);
    } catch (error) {
      logger.error({ userId, tokens, error: error.message }, '[TickerCmd] Subscribe failed');
    }
  });

  // ticker.unsubscribe command
  eventBus.on(INTERNAL_EVENTS.TICKER_UNSUBSCRIBE, ({ userId, tokens }) => {
    try {
      kiteTickerService.unsubscribe(userId, tokens);
    } catch (error) {
      logger.error({ userId, tokens, error: error.message }, '[TickerCmd] Unsubscribe failed');
    }
  });

  // ticker.setMode command
  eventBus.on(INTERNAL_EVENTS.TICKER_SET_MODE, ({ userId, tokens, mode }) => {
    try {
      kiteTickerService.setMode(userId, tokens, mode);
    } catch (error) {
      logger.error({ userId, tokens, mode, error: error.message }, '[TickerCmd] SetMode failed');
    }
  });

  logger.info('[TickerCmd] Ticker command handlers registered');
};
