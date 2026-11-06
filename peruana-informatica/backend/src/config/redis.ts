import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis | null {
    // If Redis is disabled or already initialized, return
    if (process.env.REDIS_ENABLED === 'false') {
        logger.info('Redis is disabled via environment variable');
        return null;
    }

    if (redisClient) {
        return redisClient;
    }

    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = new Redis(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true, // Don't connect immediately
        });

        // Connect manually to handle errors
        redisClient.connect().then(() => {
            logger.info('Redis connected successfully');
            isRedisAvailable = true;
        }).catch((error) => {
            logger.warn('Redis connection failed. Running without cache', { error: error.message });
            isRedisAvailable = false;
            redisClient = null;
        });

        // Handle connection errors
        redisClient.on('error', (error) => {
            logger.warn('Redis error', { error: error.message });
            isRedisAvailable = false;
        });

        // Handle reconnection
        redisClient.on('connect', () => {
            logger.info('Redis reconnected');
            isRedisAvailable = true;
        });

        return redisClient;
    } catch (error) {
        logger.error('Failed to initialize Redis', { error });
        return null;
    }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
    return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisReady(): boolean {
    return isRedisAvailable && redisClient !== null;
}

/**
 * Set cache with TTL
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!isRedisReady()) return;

    try {
        const serialized = JSON.stringify(value);
        await redisClient!.setex(key, ttlSeconds, serialized);
    } catch (error) {
        logger.warn('Failed to set cache', { error });
    }
}

/**
 * Get cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
    if (!isRedisReady()) return null;

    try {
        const cached = await redisClient!.get(key);
        if (!cached) return null;

        return JSON.parse(cached) as T;
    } catch (error) {
        logger.warn('Failed to get cache', { error });
        return null;
    }
}

/**
 * Delete cache
 */
export async function deleteCache(key: string): Promise<void> {
    if (!isRedisReady()) return;

    try {
        await redisClient!.del(key);
    } catch (error) {
        logger.warn('Failed to delete cache', { error });
    }
}

/**
 * Delete cache by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
    if (!isRedisReady()) return;

    try {
        const keys = await redisClient!.keys(pattern);
        if (keys.length > 0) {
            await redisClient!.del(...keys);
        }
    } catch (error) {
        logger.warn('Failed to delete cache pattern', { error });
    }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
    if (!isRedisReady()) return;

    try {
        await redisClient!.flushdb();
        logger.info('All cache cleared');
    } catch (error) {
        logger.warn('Failed to clear all cache', { error });
    }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isRedisAvailable = false;
        logger.info('Redis connection closed');
    }
}
