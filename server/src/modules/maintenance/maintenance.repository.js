import { db } from '../../db/index.js';
import { engineState, systemLogs } from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';

class MaintenanceRepository {
  /**
   * Get all engine states
   */
  async getEngineStates() {
    return await db.select().from(engineState).orderBy(engineState.engineName);
  }

  /**
   * Update pause status for all engines
   */
  async updateAllEnginesPauseStatus(isPaused, reason) {
    return await db.update(engineState)
      .set({ 
        isPaused, 
        pauseReason: reason, 
        updatedAt: new Date() 
      })
      .returning();
  }

  /**
   * Log maintenance action
   */
  async logMaintenanceAction(action, metadata) {
    return await db.insert(systemLogs).values({
      level: 'INFO',
      module: 'MAINTENANCE',
      message: `Action: ${action}`,
      metadata,
      createdAt: new Date()
    });
  }

  /**
   * EOD Placeholder: Refreshing stats
   * In a real system, this would call complex procedures or set flags for workers
   */
  async triggerEOD() {
    // This is a placeholder for actual EOD logic which usually happens via Redis or Queue
    return { status: 'QUEUED', message: 'EOD processing initiated' };
  }
}

export default new MaintenanceRepository();
