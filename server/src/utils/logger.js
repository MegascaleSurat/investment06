import pino from 'pino';
import { env } from '../config/env.js';

const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

export const orderLogger = logger.child({ module: 'order-engine' });
export const strategyLogger = logger.child({ module: 'strategy-engine' });
export const exitLogger = logger.child({ module: 'exit-engine' });
export const httpLogger = logger.child({ module: 'http' });

export default logger;
