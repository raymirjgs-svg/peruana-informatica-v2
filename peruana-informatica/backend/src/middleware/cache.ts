import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, isRedisReady, deleteCachePattern } from '../config/redis';

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
    products: 'products:*',
    product: (id: number) => `product:${id}`,
    productBySlug: (slug: string) => `product:slug:${slug}`,
    categories: 'categories:*',
    category: (id: number) => `category:${id}`,
    brands: 'brands:*',
    brand: (id: number) => `brand:${id}`,
    featured: 'products:featured:*',
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
    if (!isRedisReady()) return;
    await deleteCachePattern(pattern);
};

/**
 * Invalidate all product-related cache
 */
export const invalidateProductsCache = async (): Promise<void> => {
    await invalidateCache(CACHE_KEYS.products);
};

/**
 * Invalidate specific product cache
 */
export const invalidateProductCache = async (id: number, slug?: string): Promise<void> => {
    await invalidateCache(CACHE_KEYS.product(id));
    if (slug) {
        await invalidateCache(CACHE_KEYS.productBySlug(slug));
    }
    await invalidateProductsCache();
};

/**
 * Invalidate categories cache
 */
export const invalidateCategoriesCache = async (): Promise<void> => {
    await invalidateCache(CACHE_KEYS.categories);
};

/**
 * Invalidate brands cache
 */
export const invalidateBrandsCache = async (): Promise<void> => {
    await invalidateCache(CACHE_KEYS.brands);
};

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
    const sortedQuery = Object.keys(req.query).sort().reduce((acc: Record<string, any>, key) => {
        acc[key] = req.query[key];
        return acc;
    }, {});
    return `${prefix}:${path}:${JSON.stringify(sortedQuery)}`;
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
