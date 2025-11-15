import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const WINDOW_IN_SECONDS = 60 * 60;

let redisClient: Redis | null = null;

if (env.REDIS_URL) {
  redisClient = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2
  });

  redisClient.on('error', (error) => {
    logger.error('Redis error in rate limiter', { error: error.message });
  });
}

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

async function ensureRedisConnection() {
  if (!redisClient) return;
  if (['wait', 'connecting', 'connect', 'ready'].includes(redisClient.status)) {
    if (redisClient.status === 'wait' || redisClient.status === 'connecting') {
      await redisClient.connect();
    }
    return;
  }
  await redisClient.connect();
}

async function redisRateLimit(key: string, limit: number): Promise<RateLimitResult> {
  if (!redisClient) {
    return { success: true, remaining: limit, reset: Date.now() + WINDOW_IN_SECONDS * 1000 };
  }

  await ensureRedisConnection();
  const current = await redisClient.incr(key);
  if (current === 1) {
    await redisClient.expire(key, WINDOW_IN_SECONDS);
  }
  const ttl = await redisClient.ttl(key);
  return {
    success: current <= limit,
    remaining: Math.max(limit - current, 0),
    reset: Date.now() + ttl * 1000
  };
}

function memoryRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const existing = inMemoryStore.get(key);
  if (!existing || existing.expiresAt < now) {
    inMemoryStore.set(key, { count: 1, expiresAt: now + WINDOW_IN_SECONDS * 1000 });
    return { success: true, remaining: limit - 1, reset: now + WINDOW_IN_SECONDS * 1000 };
  }

  existing.count += 1;
  inMemoryStore.set(key, existing);
  return {
    success: existing.count <= limit,
    remaining: Math.max(limit - existing.count, 0),
    reset: existing.expiresAt
  };
}

export async function checkRateLimit(identifier: string, limit = 60): Promise<RateLimitResult> {
  const key = `rate-limit:${identifier}`;
  if (redisClient) {
    try {
      return await redisRateLimit(key, limit);
    } catch (error) {
      logger.error('Falling back to in-memory rate limiter', { error: (error as Error).message });
      if (redisClient) {
        // Silently disconnect Redis client on fallback
        try {
          void redisClient.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }
      redisClient = null;
    }
  }

  return memoryRateLimit(key, limit);
}

export function resetInMemoryRateLimits() {
  inMemoryStore.clear();
}
