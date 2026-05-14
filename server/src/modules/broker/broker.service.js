import brokerRepository from './broker.repository.js';
import { encrypt, decrypt, maskKey } from '../../utils/encryption.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

class BrokerService {
  async saveCredentials(userId, data) {
    const { apiKey, apiSecret, brokerName } = data;
    
    const encryptedSecret = encrypt(apiSecret);
    
    const credentials = await brokerRepository.saveCredentials({
      userId,
      brokerName: brokerName || 'ZERODHA',
      apiKey,
      apiSecretEncrypted: encryptedSecret,
    });

    logger.info({
      module: 'broker',
      action: 'saveCredentials',
      userId,
      status: 'success'
    }, 'Broker credentials saved successfully');

    return {
      apiKey: maskKey(credentials.apiKey),
      brokerName: credentials.brokerName,
      updatedAt: credentials.updatedAt,
    };
  }

  async getCredentials(userId) {
    const credentials = await brokerRepository.findCredentialsByUserId(userId);
    if (!credentials) {
      throw new ApiError(404, 'Broker credentials not found');
    }

    return {
      apiKey: maskKey(credentials.apiKey),
      brokerName: credentials.brokerName,
      updatedAt: credentials.updatedAt,
    };
  }

  async deleteCredentials(userId) {
    await brokerRepository.deleteCredentials(userId);
    logger.info({
      module: 'broker',
      action: 'deleteCredentials',
      userId,
      status: 'success'
    }, 'Broker credentials removed');
  }

  async getSessionStatus(userId) {
    const session = await brokerRepository.findSessionByUserId(userId);
    if (!session) {
      return { active: false, message: 'No active session found' };
    }

    const isExpired = session.expiresAt && new Date() > new Date(session.expiresAt);
    if (isExpired) {
      return { active: false, message: 'Session expired' };
    }

    return { 
      active: true, 
      expiresAt: session.expiresAt,
      lastUpdated: session.updatedAt 
    };
  }
}

export default new BrokerService();
