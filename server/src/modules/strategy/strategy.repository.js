import { db } from '../../db/index.js';
import { strategies, strategyConfigs } from '../../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

class StrategyRepository {
  /**
   * List all strategies with their active config
   */
  async getAllStrategies() {
    return await db.select({
      id: strategies.id,
      name: strategies.name,
      description: strategies.description,
      isActive: strategies.isActive,
      config: {
        id: strategyConfigs.id,
        version: strategyConfigs.version,
        targetMode: strategyConfigs.targetMode,
        isActive: strategyConfigs.isActive,
        updatedAt: strategyConfigs.updatedAt
      }
    })
    .from(strategies)
    .leftJoin(strategyConfigs, and(
      eq(strategies.id, strategyConfigs.strategyId),
      eq(strategyConfigs.isActive, true)
    ))
    .orderBy(strategies.name);
  }

  /**
   * Get strategy by ID with its active config
   */
  async getStrategyById(id) {
    const [record] = await db.select()
      .from(strategies)
      .where(eq(strategies.id, id));
    
    if (!record) return null;

    const [config] = await db.select()
      .from(strategyConfigs)
      .where(and(
        eq(strategyConfigs.strategyId, id),
        eq(strategyConfigs.isActive, true)
      ));

    return { ...record, config };
  }

  /**
   * Create base strategy
   */
  async createStrategy(data) {
    const [record] = await db.insert(strategies).values(data).returning();
    return record;
  }

  /**
   * Create strategy config (version)
   */
  async createConfig(data) {
    const [record] = await db.insert(strategyConfigs).values(data).returning();
    return record;
  }

  /**
   * Deactivate all versions of a strategy
   */
  async deactivateAllConfigs(strategyId) {
    return await db.update(strategyConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(strategyConfigs.strategyId, strategyId));
  }

  /**
   * Activate a specific version
   */
  async activateConfig(configId) {
    return await db.update(strategyConfigs)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(strategyConfigs.id, configId))
      .returning();
  }

  /**
   * Get latest version string for a strategy
   */
  async getLatestVersion(strategyId) {
    const [record] = await db.select({ version: strategyConfigs.version })
      .from(strategyConfigs)
      .where(eq(strategyConfigs.strategyId, strategyId))
      .orderBy(desc(strategyConfigs.version))
      .limit(1);
    return record ? record.version : '0.0.0';
  }

  /**
   * List all versions (configs) of a strategy
   */
  async getStrategyVersions(strategyId) {
    return await db.select()
      .from(strategyConfigs)
      .where(eq(strategyConfigs.strategyId, strategyId))
      .orderBy(desc(strategyConfigs.version));
  }

  async findByName(name) {
    const [record] = await db.select().from(strategies).where(eq(strategies.name, name));
    return record;
  }
}

export default new StrategyRepository();
