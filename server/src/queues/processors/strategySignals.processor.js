import logger from '../../config/logger.js';
import strategySignalsService from '../services/strategySignalsService.js';
import { strategyJobDataSchema } from '../validators/strategySignals.validation.js';
import { JOB_NAMES } from '../constants/strategySignals.js';

/**
 * Global dispatcher for Strategy and Signal queue jobs.
 * Enforces schema validation and structured logging.
 */
export const strategySignalsProcessor = async (job) => {
  const { name, data, id } = job;
  
  logger.info({ jobId: id, jobName: name }, `👷 [StrategySignalsProcessor] Job received`);

  // Validate parameters
  const parsed = strategyJobDataSchema.safeParse(data);
  if (!parsed.success) {
    logger.error({ jobId: id, errors: parsed.error.format() }, `❌ [StrategySignalsProcessor] Validation failed`);
    throw new Error(`Job parameters validation failed: ${JSON.stringify(parsed.error.format())}`);
  }

  logger.info({ jobId: id, jobName: name }, `⚡ [StrategySignalsProcessor] Job started`);

  try {
    let result = { success: true };
    switch (name) {
      case JOB_NAMES.RUN_ENTRY_CHECKS:
        result = await strategySignalsService.runTrackedStockEngine();
        break;

      case JOB_NAMES.MONITOR_CONFIRMATION_TIMERS:
        result = await strategySignalsService.monitorConfirmationTimers();
        break;

      case JOB_NAMES.RUN_WEAK_MARKET_EXCEPTION:
        result = await strategySignalsService.runWeakMarketException();
        break;

      case JOB_NAMES.EVALUATE_SIGNAL_QUALITY:
        result = await strategySignalsService.evaluateSignalQuality();
        break;

      default:
        logger.error({ jobId: id, jobName: name }, `❌ [StrategySignalsProcessor] Unknown job name`);
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, `✅ [StrategySignalsProcessor] Job completed successfully`);
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, `❌ [StrategySignalsProcessor] Job failed`);
    throw error; // Let BullMQ handle retry / DLQ logic
  }
};

export default strategySignalsProcessor;
