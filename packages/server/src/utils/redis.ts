import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private static instance: Redis;

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
        console.error('Redis connection error:', err);
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
