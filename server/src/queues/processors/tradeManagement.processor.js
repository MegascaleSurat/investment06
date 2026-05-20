import logger from '../../config/logger.js';
import tradeManagementService from '../services/tradeManagementService.js';
import { cronJobSchema, partialFillJobSchema } from '../validators/tradeManagement.validation.js';
import { JOB_NAMES } from '../constants/tradeManagement.js';

/**
 * Global dispatcher for Trade Management queue jobs.
 */
export const tradeManagementProcessor = async (job) => {
  const { name, data, id } = job;

  logger.info({ jobId: id, jobName: name }, '👷 [TradeManagementProcessor] Job received');

  try {
    let result = { success: true };

    switch (name) {
      case JOB_NAMES.MONITOR_POSITIONS: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.monitorInvestedStocks();
        break;
      }

      case JOB_NAMES.EVALUATE_TRAILING_SL: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.evaluateTrailingSL();
        break;
      }

      case JOB_NAMES.RUN_EXIT_RULES: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.evaluateExitRules();
        break;
      }

      case JOB_NAMES.INCREMENT_HOLDING_DAYS: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.incrementHoldingDays();
        break;
      }

      case JOB_NAMES.PROCESS_COOLDOWNS: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.processCooldownTracker();
        break;
      }

      case JOB_NAMES.HANDLE_PARTIAL_FILL: {
        const parsed = partialFillJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed: ${JSON.stringify(parsed.error.format())}`);
        result = await tradeManagementService.processPartialFill(parsed.data);
        break;
      }

      default:
        logger.error({ jobId: id, jobName: name }, '❌ [TradeManagementProcessor] Unknown job name');
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, '✅ [TradeManagementProcessor] Job completed successfully');
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, '❌ [TradeManagementProcessor] Job failed');
    throw error;
  }
};

export default tradeManagementProcessor;
