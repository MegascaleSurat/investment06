import logger from '../../config/logger.js';
import orderExecutionService from '../services/orderExecutionService.js';
import { 
  buyOrderJobSchema,
  stopLossJobSchema,
  modifyStopLossJobSchema,
  sellOrderJobSchema,
  orderPollerJobSchema
} from '../validators/orderExecution.validation.js';
import { JOB_NAMES } from '../constants/orderExecution.js';

/**
 * Global dispatcher for Order Execution queue jobs.
 * Handles parsing, schema validations, and Pino logging.
 */
export const orderExecutionProcessor = async (job) => {
  const { name, data, id } = job;

  logger.info({ jobId: id, jobName: name }, '👷 [OrderExecutionProcessor] Job received');

  try {
    let result = { success: true };

    switch (name) {
      case JOB_NAMES.PLACE_BUY: {
        const parsed = buyOrderJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Buy Order Job: ${JSON.stringify(parsed.error.format())}`);
        result = await orderExecutionService.placeBuyOrder(parsed.data);
        break;
      }

      case JOB_NAMES.PLACE_SL: {
        const parsed = stopLossJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Stop Loss Job: ${JSON.stringify(parsed.error.format())}`);
        result = await orderExecutionService.placeStopLoss(parsed.data);
        break;
      }

      case JOB_NAMES.MODIFY_SL: {
        const parsed = modifyStopLossJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Modify Stop Loss Job: ${JSON.stringify(parsed.error.format())}`);
        result = await orderExecutionService.modifyStopLoss(parsed.data);
        break;
      }

      case JOB_NAMES.PLACE_SELL: {
        const parsed = sellOrderJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Sell Order Job: ${JSON.stringify(parsed.error.format())}`);
        result = await orderExecutionService.placeSellOrder(parsed.data);
        break;
      }

      case JOB_NAMES.POLL_ORDER_STATUSES: {
        const parsed = orderPollerJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Order Poller Job: ${JSON.stringify(parsed.error.format())}`);
        result = await orderExecutionService.pollOrderStatuses();
        break;
      }

      default:
        logger.error({ jobId: id, jobName: name }, '❌ [OrderExecutionProcessor] Unknown job name');
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, '✅ [OrderExecutionProcessor] Job completed successfully');
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, '❌ [OrderExecutionProcessor] Job failed');
    throw error;
  }
};

export default orderExecutionProcessor;
