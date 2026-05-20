import logger from '../../config/logger.js';
import stateMachineService from '../services/stateMachineService.js';
import { stateTransitionJobSchema, cronJobSchema } from '../validators/stateMachine.validation.js';
import { JOB_NAMES } from '../constants/stateMachine.js';

/**
 * Global dispatcher for State Machine queue jobs.
 */
export const stateMachineProcessor = async (job) => {
  const { name, data, id } = job;

  logger.info({ jobId: id, jobName: name }, '👷 [StateMachineProcessor] Job received');

  try {
    let result = { success: true };

    switch (name) {
      case JOB_NAMES.PROCESS_TRANSITION: {
        const parsed = stateTransitionJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Transition: ${JSON.stringify(parsed.error.format())}`);
        result = await stateMachineService.processTransition(parsed.data);
        break;
      }

      case JOB_NAMES.DETECT_STUCK_ORDERS: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Stuck Orders Detector: ${JSON.stringify(parsed.error.format())}`);
        result = await stateMachineService.detectStuckOrders();
        break;
      }

      case JOB_NAMES.RUN_CRASH_RECOVERY: {
        const parsed = cronJobSchema.safeParse(data);
        if (!parsed.success) throw new Error(`Validation failed for Crash Recovery: ${JSON.stringify(parsed.error.format())}`);
        result = await stateMachineService.runCrashRecovery();
        break;
      }

      default:
        logger.error({ jobId: id, jobName: name }, '❌ [StateMachineProcessor] Unknown job name');
        throw new Error(`Unknown job name: ${name}`);
    }

    logger.info({ jobId: id, jobName: name }, '✅ [StateMachineProcessor] Job completed successfully');
    return result;
  } catch (error) {
    logger.error({ jobId: id, jobName: name, err: error.message }, '❌ [StateMachineProcessor] Job failed');
    throw error;
  }
};

export default stateMachineProcessor;
