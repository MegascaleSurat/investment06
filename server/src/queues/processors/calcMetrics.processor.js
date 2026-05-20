import logger from '../../config/logger.js';
import calcMetricsService from '../services/calcMetricsService.js';
import { jobParametersSchema } from '../validators/calcMetrics.validation.js';
import { JOB_NAMES } from '../constants/calcMetrics.js';

/**
 * Global router for all calculation & metrics queue processors.
 * Ensures data validation, structured logging, and crash recovery.
 */
export const calcMetricsProcessor = async (job) => {
  const { name, data, id } = job;
  
  logger.info({ jobId: id, jobName: name }, `👷 [CalcMetricsProcessor] Job received`);

  // Validate parameters
  const parsed = jobParametersSchema.safeParse(data);
  if (!parsed.success) {
    logger.error({ jobId: id, errors: parsed.error.format() }, `❌ [CalcMetricsProcessor] Validation failed`);
    throw new Error(`Job parameters validation failed: ${JSON.stringify(parsed.error.format())}`);
  }

  logger.info({ jobId: id, jobName: name }, `⚡ [CalcMetricsProcessor] Job started`);

  try {
    let result = { success: true };
    switch (name) {
      case JOB_NAMES.CALC_AVG_VOLUME:
        result = await calcMetricsService.calcAvgVolume();
        break;

      case JOB_NAMES.CALC_VOLUME_RATIO:
        result = await calcMetricsService.calcVolumeRatio();
        break;

      case JOB_NAMES.CALC_SLOT_VOLUME_BASELINE:
        result = await calcMetricsService.calcSlotVolumeBaseline();
        break;

      case JOB_NAMES.CALC_SLOT_VOLUME_RATIO:
        result = await calcMetricsService.calcSlotVolumeRatio();
        break;

      case JOB_NAMES.CALC_STOCK_METRICS:
        result = await calcMetricsService.calcStockMetrics();
        break;

      case JOB_NAMES.CALC_SECTOR_METRICS:
        result = await calcMetricsService.calcSectorMetrics();
        break;

      case JOB_NAMES.CALC_MARKET_STATUS:
        result = await calcMetricsService.calcMarketStatus();
        break;

      default:
        logger.error({ jobId: id, jobName: name }, `❌ [CalcMetricsProcessor] Unknown job name`);
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, `✅ [CalcMetricsProcessor] Job completed successfully`);
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, `❌ [CalcMetricsProcessor] Job failed`);
    throw error; // Let BullMQ handle retry / DLQ logic
  }
};
export default calcMetricsProcessor;
