import logger from '../../config/logger.js';
import maintenanceService from '../services/maintenance.service.js';
import { 
  endOfDayOrchestrationSchema,
  storeDailyCandlesSchema,
  pruneIntradayDataSchema,
  reconcilePositionsSchema,
  performanceSnapshotSchema
} from '../validators/maintenance.validation.js';
import { JOB_NAMES } from '../constants/maintenance.js';

/**
 * Global router for all maintenance, EOD, and data-trimming queue processors.
 */
export const maintenanceProcessor = async (job) => {
  const { name, data, id } = job;
  
  logger.info({ jobId: id, jobName: name }, `👷 [MaintenanceProcessor] Job received`);

  try {
    let result = { success: true };
    
    switch (name) {
      case JOB_NAMES.RUN_EOD_ORCHESTRATION: {
        const parsed = endOfDayOrchestrationSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [MaintenanceProcessor] Job started`);
        result = await maintenanceService.runEndOfDayOrchestration(parsed.data.date);
        break;
      }

      case JOB_NAMES.STORE_DAILY_CANDLES: {
        const parsed = storeDailyCandlesSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [MaintenanceProcessor] Job started`);
        result = await maintenanceService.storeDailyCandles(parsed.data.date);
        break;
      }

      case JOB_NAMES.PRUNE_INTRADAY_DATA: {
        const parsed = pruneIntradayDataSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [MaintenanceProcessor] Job started`);
        result = await maintenanceService.pruneIntradayData(parsed.data.olderThanDays);
        break;
      }

      case JOB_NAMES.RECONCILE_POSITIONS: {
        const parsed = reconcilePositionsSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [MaintenanceProcessor] Job started`);
        result = await maintenanceService.reconcilePositions(parsed.data.userId);
        break;
      }

      case JOB_NAMES.TAKE_PERFORMANCE_SNAPSHOT: {
        const parsed = performanceSnapshotSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [MaintenanceProcessor] Job started`);
        result = await maintenanceService.takePerformanceSnapshot(parsed.data.date);
        break;
      }

      default:
        logger.error({ jobId: id, jobName: name }, `❌ [MaintenanceProcessor] Unknown job name`);
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, `✅ [MaintenanceProcessor] Job completed successfully`);
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, `❌ [MaintenanceProcessor] Job failed`);
    throw error;
  }
};

export default maintenanceProcessor;
