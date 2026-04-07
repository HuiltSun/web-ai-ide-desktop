import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ERROR_LOG_INTERVAL = (() => {
  const interval = parseInt(process.env.REDIS_ERROR_LOG_INTERVAL || '5000', 10);
  return isNaN(interval) || interval <= 0 ? 5000 : interval;
})();

export class RedisClient {
  private static instance: Redis;
  private static lastErrorTime = 0;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('error', (err) => {
        const now = Date.now();
        if (now - RedisClient.lastErrorTime > REDIS_ERROR_LOG_INTERVAL) {
          console.error('Redis connection error:', err);
          RedisClient.lastErrorTime = now;
        }
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });
    }
    return RedisClient.instance;
  }

  static async close(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = undefined as any;
    }
  }
}

export const redis = RedisClient.getInstance();
