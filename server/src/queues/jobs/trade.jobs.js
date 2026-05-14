import { createQueue } from '../../config/queue.js';

export const tradeQueue = createQueue('trade-execution');

export const addTradeJob = async (tradeData) => {
  await tradeQueue.add('execute-trade', tradeData, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};
