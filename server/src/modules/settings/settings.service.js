import settingsRepository from './settings.repository.js';
import logger from '../../config/logger.js';

class SettingsService {
  /**
   * Fetch Risk Configuration
   */
  async getRiskSettings() {
    const keys = [
      'risk:capital_per_trade',
      'risk:max_live_trades',
      'risk:weak_market_qty_pct'
    ];
    const data = await settingsRepository.getSettings(keys);
    
    return {
      capitalPerTrade: parseFloat(data['risk:capital_per_trade'] || '10000'),
      maxLiveTrades: parseInt(data['risk:max_live_trades'] || '5'),
      weakMarketQtyPct: parseFloat(data['risk:weak_market_qty_pct'] || '50')
    };
  }

  /**
   * Update Risk Configuration
   */
  async updateRiskSettings(data) {
    const settingsMap = {
      'risk:capital_per_trade': data.capitalPerTrade,
      'risk:max_live_trades': data.maxLiveTrades,
      'risk:weak_market_qty_pct': data.weakMarketQtyPct
    };
    
    await settingsRepository.updateSettings(settingsMap);
    logger.info({ settingsMap }, 'Risk settings updated');
    return { message: 'Risk settings updated successfully' };
  }

  /**
   * Fetch System Configuration
   */
  async getSystemSettings() {
    const keys = [
      'system:engine_refresh_interval',
      'system:scheduler_enabled',
      'system:cooldown_period'
    ];
    const [settingsData, engineData] = await Promise.all([
      settingsRepository.getSettings(keys),
      settingsRepository.getEngineState()
    ]);

    return {
      engineRefreshInterval: parseInt(settingsData['system:engine_refresh_interval'] || '5000'),
      schedulerEnabled: settingsData['system:scheduler_enabled'] === 'true',
      engineEnabled: engineData ? !engineData.isPaused : true,
      cooldownPeriod: parseInt(settingsData['system:cooldown_period'] || '15')
    };
  }

  /**
   * Update System Configuration
   */
  async updateSystemSettings(data) {
    const settingsMap = {
      'system:engine_refresh_interval': data.engineRefreshInterval,
      'system:scheduler_enabled': data.schedulerEnabled,
      'system:cooldown_period': data.cooldownPeriod
    };

    await Promise.all([
      settingsRepository.updateSettings(settingsMap),
      settingsRepository.updateEngineState('trading_engine', !data.engineEnabled, data.engineEnabled ? null : 'Manual pause via settings')
    ]);

    logger.info({ data }, 'System settings updated');
    return { message: 'System settings updated successfully' };
  }
}

export default new SettingsService();
