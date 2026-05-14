import { KiteConnect } from 'kiteconnect';
import kiteRepository from './kite.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';


class KiteService {
  /**
   * Get Kite login URL
   */
  async getLoginUrl(userId) {
    const creds = await kiteRepository.getCredentials(userId);
    if (!creds || !creds.apiKey) {
      throw new ApiError(404, 'Kite API credentials not found. Please add them first.');
    }

    const kc = new KiteConnect({ api_key: creds.apiKey });
    return kc.getLoginURL();
  }

  /**
   * Handle Kite callback and generate session
   */
  async generateSession(userId, requestToken) {
    const creds = await kiteRepository.getCredentials(userId);
    if (!creds) {
      throw new ApiError(404, 'Kite API credentials not found');
    }

    const kc = new KiteConnect({
      api_key: creds.apiKey,
    });

    try {
      const response = await kc.generateSession(requestToken, creds.apiSecret);
      await kiteRepository.saveSession(userId, response);
      
      logger.info({
        module: 'broker',
        action: 'generateSession',
        userId,
        status: 'success'
      }, 'Kite session generated and saved');

      return response;
    } catch (error) {
      logger.error({
        module: 'broker',
        action: 'generateSession',
        userId,
        error: error.message
      }, 'Failed to generate Kite session');
      throw new ApiError(400, `Kite Session Generation Failed: ${error.message}`);
    }
  }

  /**
   * Invalidate Kite session
   */
  async invalidateSession(userId) {
    const session = await kiteRepository.getSession(userId);
    if (!session) return;

    const creds = await kiteRepository.getCredentials(userId);
    const kc = new KiteConnect({
      api_key: creds.apiKey,
      access_token: session.accessToken,
    });

    try {
      await kc.invalidateAccessToken(session.accessToken);
    } catch (error) {
      logger.warn({ userId, error: error.message }, 'Failed to invalidate token on Kite server');
    }

    await kiteRepository.deleteSession(userId);
    logger.info({ userId }, 'Kite session invalidated locally');
  }

  /**
   * Get Kite user profile
   */
  async getProfile(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getProfile();
    } catch (error) {
      throw new ApiError(401, `Kite Profile Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Get Kite margins
   */
  async getMargins(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getMargins();
    } catch (error) {
      throw new ApiError(401, `Kite Margins Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Check if Kite session is active.
   * Workers call this before any Kite API call.
   * Performs a live Kite API ping to confirm token validity.
   */
  async getSessionStatus(userId) {
    const session = await kiteRepository.getSession(userId);

    // No session found in DB
    if (!session || !session.accessToken) {
      return {
        active: false,
        reason: 'NO_SESSION',
        message: 'No active Kite session found. Please login.',
      };
    }

    // Check DB-stored expiry
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
      await kiteRepository.deleteSession(userId);
      return {
        active: false,
        reason: 'EXPIRED',
        message: 'Kite session has expired. Please login again.',
      };
    }

    // Live ping — attempt to fetch profile to confirm token is still valid on Kite's end
    try {
      const creds = await kiteRepository.getCredentials(userId);
      const kc = new KiteConnect({
        api_key: creds.apiKey,
        access_token: session.accessToken,
      });
      await kc.getProfile();

      logger.info({
        module: 'broker',
        action: 'getSessionStatus',
        userId,
        status: 'active'
      }, 'Kite session is active');

      return {
        active: true,
        reason: 'ACTIVE',
        message: 'Kite session is active.',
        loginTime: session.loginTime,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      // Token rejected by Kite — clear it from DB
      await kiteRepository.deleteSession(userId);
      logger.warn({
        module: 'broker',
        action: 'getSessionStatus',
        userId,
        error: error.message
      }, 'Kite token rejected. Session cleared.');

      return {
        active: false,
        reason: 'INVALID_TOKEN',
        message: 'Kite token is invalid or revoked. Please login again.',
      };
    }
  }

  /**
   * Internal helper to get authenticated Kite instance
   */
  async _getKiteInstance(userId) {
    const [creds, session] = await Promise.all([
      kiteRepository.getCredentials(userId),
      kiteRepository.getSession(userId)
    ]);

    if (!creds || !session || !session.accessToken) {
      throw new ApiError(401, 'Kite session not found or expired. Please login again.');
    }

    return new KiteConnect({
      api_key: creds.apiKey,
      access_token: session.accessToken,
    });
  }

  /**
   * Place Order on Kite
   */
  async placeOrder(userId, params) {
    const kc = await this._getKiteInstance(userId);
    try {
      const orderParams = {
        tradingsymbol: params.symbol,
        exchange: params.exchange || 'NSE',
        transaction_type: params.transaction_type,
        order_type: params.order_type,
        quantity: params.quantity,
        product: params.product || 'MIS',
        price: params.price,
        trigger_price: params.trigger_price,
        validity: 'DAY'
      };

      const result = await kc.placeOrder('regular', orderParams);
      logger.info({ userId, symbol: params.symbol, orderId: result.order_id }, 'Order placed on Kite');
      return result;
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Failed to place order on Kite');
      throw new ApiError(400, `Kite Order Placement Failed: ${error.message}`);
    }
  }

  /**
   * Modify Order on Kite
   */
  async modifyOrder(userId, orderId, params) {
    const kc = await this._getKiteInstance(userId);
    try {
      const result = await kc.modifyOrder('regular', orderId, params);
      logger.info({ userId, orderId }, 'Order modified on Kite');
      return result;
    } catch (error) {
      throw new ApiError(400, `Kite Order Modification Failed: ${error.message}`);
    }
  }

  /**
   * Cancel Order on Kite
   */
  async cancelOrder(userId, orderId) {
    const kc = await this._getKiteInstance(userId);
    try {
      const result = await kc.cancelOrder('regular', orderId);
      logger.info({ userId, orderId }, 'Order cancelled on Kite');
      return result;
    } catch (error) {
      throw new ApiError(400, `Kite Order Cancellation Failed: ${error.message}`);
    }
  }

  /**
   * Fetch Today's Orders from Kite
   */
  async getOrders(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getOrders();
    } catch (error) {
      throw new ApiError(400, `Kite Orders Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Get specific order status
   */
  async getOrderInfo(userId, orderId) {
    const kc = await this._getKiteInstance(userId);
    try {
      const history = await kc.getOrderHistory(orderId);
      // Last entry in history is the latest status
      return history[history.length - 1];
    } catch (error) {
      throw new ApiError(400, `Kite Order Status Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Get trades/fills for a specific order
   */
  async getOrderTrades(userId, orderId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getOrderTrades(orderId);
    } catch (error) {
      throw new ApiError(400, `Kite Order Trades Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Fetch Positions from Kite
   */
  async getPositions(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getPositions();
    } catch (error) {
      throw new ApiError(400, `Kite Positions Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Fetch Holdings from Kite
   */
  async getHoldings(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getHoldings();
    } catch (error) {
      throw new ApiError(400, `Kite Holdings Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Place GTT Stop-Loss Order
   */
  async placeGtt(userId, params) {
    const kc = await this._getKiteInstance(userId);
    try {
      const gttParams = {
        tradingsymbol: params.symbol,
        exchange: params.exchange || 'NSE',
        trigger_type: kc.GTT_TYPE_SINGLE, // Default to single trigger for SL
        trigger_values: [params.trigger_price],
        orders: [{
          transaction_type: params.transaction_type,
          order_type: kc.ORDER_TYPE_LIMIT,
          quantity: params.quantity,
          product: kc.PRODUCT_CNC, // GTT usually for CNC/long-term
          price: params.price
        }]
      };

      const result = await kc.placeGTT(gttParams);
      logger.info({ userId, symbol: params.symbol, gttId: result.trigger_id }, 'GTT placed on Kite');
      return result;
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Failed to place GTT on Kite');
      throw new ApiError(400, `Kite GTT Placement Failed: ${error.message}`);
    }
  }

  /**
   * Modify GTT Order
   */
  async modifyGtt(userId, gttId, params) {
    const kc = await this._getKiteInstance(userId);
    try {
      // Fetch existing GTT to get baseline values if needed
      const existing = await kc.getGTT(gttId);
      
      const gttParams = {
        trigger_type: existing.type,
        trigger_values: params.trigger_price ? [params.trigger_price] : existing.condition.trigger_values,
        orders: [{
          transaction_type: existing.orders[0].transaction_type,
          order_type: existing.orders[0].order_type,
          quantity: params.quantity || existing.orders[0].quantity,
          product: existing.orders[0].product,
          price: params.price || existing.orders[0].price
        }]
      };

      const result = await kc.modifyGTT(gttId, gttParams);
      logger.info({ userId, gttId }, 'GTT modified on Kite');
      return result;
    } catch (error) {
      throw new ApiError(400, `Kite GTT Modification Failed: ${error.message}`);
    }
  }

  /**
   * Delete GTT Order
   */
  async deleteGtt(userId, gttId) {
    const kc = await this._getKiteInstance(userId);
    try {
      const result = await kc.deleteGTT(gttId);
      logger.info({ userId, gttId }, 'GTT deleted from Kite');
      return result;
    } catch (error) {
      throw new ApiError(400, `Kite GTT Deletion Failed: ${error.message}`);
    }
  }

  /**
   * List All GTTs
   */
  async getGtts(userId) {
    const kc = await this._getKiteInstance(userId);
    try {
      return await kc.getGTTs();
    } catch (error) {
      throw new ApiError(400, `Kite GTTs Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Fetch Order History for past N days
   */
  async getOrderHistory(userId, days = 7) {
    const kc = await this._getKiteInstance(userId);
    try {
      // Kite's getOrders() only returns today's orders.
      // For history beyond today, we usually rely on trade_orders table,
      // but if the user wants broker-side history, it's limited to today in standard API.
      // However, we can fetch specific order history for any order ID.
      // To get past days' orders list, we usually recommend using our DB.
      // If the user insists on Broker API, we fetch today's orders as a proxy for 'recent' history.
      return await kc.getOrders();
    } catch (error) {
      throw new ApiError(400, `Kite Order History Fetch Failed: ${error.message}`);
    }
  }

  /**
   * Calculate required margins
   */
  async calculateMargins(userId, orders) {
    const kc = await this._getKiteInstance(userId);
    try {
      // KiteConnect v3 supports order margin calculation
      // orders is an array of { exchange, tradingsymbol, transaction_type, quantity, order_type, product, price, trigger_price }
      return await kc.orderMargin(orders);
    } catch (error) {
      throw new ApiError(400, `Kite Margin Calculation Failed: ${error.message}`);
    }
  }

  /**
   * Place Basket Orders
   */
  async placeBasketOrders(userId, orders) {
    const kc = await this._getKiteInstance(userId);
    const results = [];
    
    // Basket orders are usually individual calls in Kite JS lib
    for (const order of orders) {
      try {
        const orderParams = {
          tradingsymbol: order.symbol,
          exchange: order.exchange || 'NSE',
          transaction_type: order.transaction_type,
          order_type: order.order_type,
          quantity: order.quantity,
          product: order.product || 'MIS',
          price: order.price,
          trigger_price: order.trigger_price,
          validity: 'DAY'
        };
        const res = await kc.placeOrder('regular', orderParams);
        results.push({ symbol: order.symbol, order_id: res.order_id, status: 'SUCCESS' });
      } catch (error) {
        results.push({ symbol: order.symbol, status: 'FAILED', message: error.message });
      }
    }
    
    return results;
  }

  /**
   * Verify SL Trigger Price
   */
  async verifySlTrigger(userId, { symbol, exchange, trigger_price, transaction_type }) {
    const kc = await this._getKiteInstance(userId);
    try {
      // 1. Get quote to check price bands and tick size
      const quote = await kc.getQuote(`${exchange}:${symbol}`);
      const instrument = quote[`${exchange}:${symbol}`];
      
      const tickSize = instrument.lower_circuit_limit ? 0.05 : 0.05; // Standard NSE tick size
      
      // 2. Validate tick size
      if ((trigger_price * 100) % (tickSize * 100) !== 0) {
        throw new Error(`Invalid trigger price. Must be a multiple of ${tickSize}`);
      }

      // 3. Validate circuit limits
      if (trigger_price < instrument.lower_circuit_limit || trigger_price > instrument.upper_circuit_limit) {
        throw new Error(`Trigger price ${trigger_price} is outside circuit limits [${instrument.lower_circuit_limit} - ${instrument.upper_circuit_limit}]`);
      }

      // 4. Directional check (BUY SL must be > CMP, SELL SL must be < CMP)
      const lastPrice = instrument.last_price;
      if (transaction_type === 'BUY' && trigger_price <= lastPrice) {
        throw new Error(`Buy Stop-Loss trigger price must be above current price (${lastPrice})`);
      }
      if (transaction_type === 'SELL' && trigger_price >= lastPrice) {
        throw new Error(`Sell Stop-Loss trigger price must be below current price (${lastPrice})`);
      }

      return {
        valid: true,
        lastPrice,
        limits: {
          lower: instrument.lower_circuit_limit,
          upper: instrument.upper_circuit_limit
        }
      };
    } catch (error) {
      throw new ApiError(400, `SL Verification Failed: ${error.message}`);
    }
  }
}

export default new KiteService();
