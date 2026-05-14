import maintenanceRepository from './maintenance.repository.js';
import logger from '../../config/logger.js';

class MaintenanceService {
  /**
   * Trigger End of Day Jobs
   */
  async triggerEOD(userId) {
    logger.info({ userId }, 'Manual EOD trigger received');
    
    // 1. Log the action
    await maintenanceRepository.logMaintenanceAction('MANUAL_EOD_TRIGGER', { triggeredBy: userId });
    
    // 2. Call the logic
    return await maintenanceRepository.triggerEOD();
  }

  /**
   * Pause All Engines
   */
  async pauseAllEngines(userId, reason) {
    logger.warn({ userId, reason }, 'Request to PAUSE all engines');
    
    const results = await maintenanceRepository.updateAllEnginesPauseStatus(true, reason || 'Manual pause by admin');
    
    await maintenanceRepository.logMaintenanceAction('PAUSE_ALL_ENGINES', { 
      triggeredBy: userId, 
      reason,
      affectedEngines: results.map(r => r.engineName)
    });

    return results;
  }

  /**
   * Resume All Engines
   */
  async resumeAllEngines(userId) {
    logger.info({ userId }, 'Request to RESUME all engines');
    
    const results = await maintenanceRepository.updateAllEnginesPauseStatus(false, null);
    
    await maintenanceRepository.logMaintenanceAction('RESUME_ALL_ENGINES', { 
      triggeredBy: userId,
      affectedEngines: results.map(r => r.engineName)
    });

    return results;
  }

  /**
   * Get Engine Statuses
   */
  async getEngineStatuses() {
    const states = await maintenanceRepository.getEngineStates();
    return states.map(s => ({
      name: s.engineName,
      status: s.status,
      isPaused: s.isPaused,
      lastRun: s.lastRunAt,
      nextRun: s.nextRunAt,
      heartbeat: s.heartbeatAt,
      reason: s.pauseReason
    }));
  }
}

export default new MaintenanceService();
