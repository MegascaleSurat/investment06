import { db } from '../../db/index.js';
import { settings, engineState } from '../../db/schema/index.js';
import { eq, inArray } from 'drizzle-orm';

class SettingsRepository {
  /**
   * Get multiple settings by keys
   */
  async getSettings(keys) {
    const results = await db.select()
      .from(settings)
      .where(inArray(settings.settingKey, keys));
    
    // Convert to object { key: value }
    return results.reduce((acc, curr) => {
      acc[curr.settingKey] = curr.settingValue;
      return acc;
    }, {});
  }

  /**
   * Update multiple settings
   */
  async updateSettings(settingsMap) {
    return await db.transaction(async (tx) => {
      const updates = Object.entries(settingsMap).map(([key, value]) => {
        return tx.insert(settings)
          .values({ 
            settingKey: key, 
            settingValue: String(value),
            updatedAt: new Date() 
          })
          .onConflictDoUpdate({
            target: settings.settingKey,
            set: { 
              settingValue: String(value),
              updatedAt: new Date() 
            }
          });
      });
      await Promise.all(updates);
    });
  }

  /**
   * Get engine state
   */
  async getEngineState(name = 'trading_engine') {
    const [record] = await db.select()
      .from(engineState)
      .where(eq(engineState.engineName, name));
    return record;
  }

  /**
   * Update engine state (paused/active)
   */
  async updateEngineState(name, isPaused, reason) {
    return await db.update(engineState)
      .set({ isPaused, pauseReason: reason, updatedAt: new Date() })
      .where(eq(engineState.engineName, name))
      .returning();
  }
}

export default new SettingsRepository();
