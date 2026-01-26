import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, isRedisReady } from '../config/redis';

/**
 * Cache middleware factory
 * @param keyPrefix - Prefix for cache key
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export function cacheMiddleware(keyPrefix: string, ttl: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip cache if Redis is not available
        if (!isRedisReady()) {
            return next();
        }

        try {
            // Generate cache key from request
            const cacheKey = generateCacheKey(keyPrefix, req);

            // Try to get from cache
            const cached = await getCache(cacheKey);

            if (cached) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json(cached);
            }

            console.log(`❌ Cache MISS: ${cacheKey}`);

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache the response
            res.json = function (data: any) {
                // Cache the response
                setCache(cacheKey, data, ttl).catch((error) => {
                    console.warn('Failed to cache response:', error);
                });

                // Call original json method
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(prefix: string, req: Request): string {
    const path = req.path;
    const query = JSON.stringify(req.query);
    return `${prefix}:${path}:${query}`;
}

/**
 * Cache only on successful responses
 */
export function cacheSuccessMiddleware(keyPrefix: string, ttl: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!isRedisReady()) {
            return next();
        }

        const cacheKey = generateCacheKey(keyPrefix, req);

        // Check cache
        const cached = await getCache(cacheKey);
        if (cached) {
            console.log(`✅ Cache HIT: ${cacheKey}`);
            return res.json(cached);
        }

        // Store original methods
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);
        let statusCode = 200;

        // Track status code
        res.status = function (code: number) {
            statusCode = code;
            return originalStatus(code);
        };

        // Override json to cache only on success
        res.json = function (data: any) {
            if (statusCode >= 200 && statusCode < 300) {
                setCache(cacheKey, data, ttl).catch(() => { });
            }
            return originalJson(data);
        };

        next();
    };
}
