// import Redis from 'ioredis';
// import { env } from './env.js';
// import logger from './logger.js';

// const redisConfig = {
//   host: env.REDIS_HOST,
//   port: env.REDIS_PORT,
//   password: env.REDIS_PASSWORD,
//   retryStrategy: (times) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// };

// export const redis = new Redis(redisConfig);

// redis.on('connect', () => logger.info('🚀 Redis connected successfully'));
// redis.on('error', (err) => logger.error('❌ Redis connection error:', err));

export const redis = null;
export default redis;
