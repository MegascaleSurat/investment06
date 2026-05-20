import logger from '../../config/logger.js';
import alertNotificationService from '../services/alertNotification.service.js';
import { 
  dispatchAlertSchema,
  checkHeartbeatsSchema,
  reconnectKiteSchema,
  writeTradeLogSchema
} from '../validators/alertNotification.validation.js';
import { JOB_NAMES } from '../constants/alertNotification.js';

/**
 * Global router for all alert, notification, and async logging queue processors.
 */
export const alertNotificationProcessor = async (job) => {
  const { name, data, id } = job;
  
  logger.info({ jobId: id, jobName: name }, `👷 [AlertNotificationProcessor] Job received`);

  try {
    let result = { success: true };
    
    switch (name) {
      case JOB_NAMES.DISPATCH_ALERT: {
        const parsed = dispatchAlertSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [AlertNotificationProcessor] Job started`);
        result = await alertNotificationService.dispatchAlert(parsed.data);
        break;
      }

      case JOB_NAMES.CHECK_HEARTBEATS: {
        const parsed = checkHeartbeatsSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [AlertNotificationProcessor] Job started`);
        result = await alertNotificationService.checkEngineHeartbeats();
        break;
      }

      case JOB_NAMES.RECONNECT_KITE: {
        const parsed = reconnectKiteSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [AlertNotificationProcessor] Job started`);
        result = await alertNotificationService.reconnectKite(parsed.data.userId, parsed.data.attempt);
        break;
      }

      case JOB_NAMES.WRITE_TRADE_LOG: {
        const parsed = writeTradeLogSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        }
        logger.info({ jobId: id, jobName: name }, `⚡ [AlertNotificationProcessor] Job started`);
        result = await alertNotificationService.writeTradeLog(parsed.data);
        break;
      }

      default:
        logger.error({ jobId: id, jobName: name }, `❌ [AlertNotificationProcessor] Unknown job name`);
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, `✅ [AlertNotificationProcessor] Job completed successfully`);
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, `❌ [AlertNotificationProcessor] Job failed`);
    throw error;
  }
};

export default alertNotificationProcessor;
