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
}

export default new KiteService();
