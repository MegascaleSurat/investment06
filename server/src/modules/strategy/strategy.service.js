import strategyRepository from './strategy.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';
import { db } from '../../db/index.js';

class StrategyService {
  /**
   * List all strategies
   */
  async getAllStrategies() {
    return await strategyRepository.getAllStrategies();
  }

  /**
   * Get full strategy details with active config
   */
  async getStrategyDetails(id) {
    const strategy = await strategyRepository.getStrategyById(id);
    if (!strategy) {
      throw new ApiError(404, 'Strategy not found');
    }
    return strategy;
  }

  /**
   * Create new strategy with initial config
   */
  async createStrategy(data) {
    const { config, ...strategyData } = data;
    
    // Check name uniqueness
    const existing = await strategyRepository.findByName(strategyData.name);
    if (existing) {
      throw new ApiError(400, 'Strategy with this name already exists');
    }

    return await db.transaction(async (tx) => {
      const strategy = await strategyRepository.createStrategy(strategyData);
      
      await strategyRepository.createConfig({
        ...config,
        strategyId: strategy.id,
        version: '1.0.0',
        isActive: true
      });

      logger.info({ strategyId: strategy.id, name: strategy.name }, 'Strategy created with initial config');
      return strategy;
    });
  }

  /**
   * Update strategy (bumps version if config changes)
   */
  async updateStrategy(id, data) {
    const { config, ...strategyData } = data;
    const strategy = await strategyRepository.getStrategyById(id);
    if (!strategy) {
      throw new ApiError(404, 'Strategy not found');
    }

    // If config is provided, we create a new version (bump)
    if (config) {
      const latestVersion = await strategyRepository.getLatestVersion(id);
      const nextVersion = this._bumpVersion(latestVersion);

      return await db.transaction(async (tx) => {
        // Deactivate previous configs for new trades
        await strategyRepository.deactivateAllConfigs(id);

        const newConfig = await strategyRepository.createConfig({
          ...strategy.config, // Inherit from old config
          ...config,          // Apply updates
          strategyId: id,
          version: nextVersion,
          isActive: true
        });

        logger.info({ strategyId: id, newVersion: nextVersion }, 'Strategy updated with new version');
        return { ...strategy, config: newConfig };
      });
    }

    // Otherwise, just update strategy metadata (not implemented in repo yet, but could be)
    return strategy;
  }

  /**
   * Activate a strategy for new trades
   */
  async activateStrategy(id) {
    const strategy = await strategyRepository.getStrategyById(id);
    if (!strategy) {
      throw new ApiError(404, 'Strategy not found');
    }

    // Ensure it's active in the base table
    // and that the latest config is active (this logic might vary based on requirements)
    await strategyRepository.deactivateAllConfigs(id);
    const versions = await strategyRepository.getStrategyVersions(id);
    const latest = versions[0];
    
    const [activated] = await strategyRepository.activateConfig(latest.id);
    logger.info({ strategyId: id, configId: latest.id }, 'Strategy version activated');
    
    return activated;
  }

  /**
   * List version history
   */
  async getVersionHistory(id) {
    const versions = await strategyRepository.getStrategyVersions(id);
    if (!versions.length) {
      throw new ApiError(404, 'No versions found for this strategy');
    }
    return versions;
  }

  /**
   * Helper to bump semver-like version
   */
  _bumpVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2] += 1; // Bump patch
    return parts.join('.');
  }
}

export default new StrategyService();
