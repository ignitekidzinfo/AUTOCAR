/**
 * Cache utility functions for managing application-wide cache invalidation
 */

export const CACHE_KEYS = {
  PURCHASE_BILLS: 'purchase_bills_cache',
  VENDORS: 'vendors_cache',
  SPARE_PARTS: 'spare_parts_cache',
  TRANSACTIONS: 'transactions_cache',
} as const;

/**
 * Invalidate a specific cache by key
 */
export const invalidateCache = (cacheKey: string): void => {
  console.log(`Invalidating cache: ${cacheKey}`);
  localStorage.removeItem(cacheKey);
  
  // Also clear any related etags
  const etagKey = `${cacheKey}_etag`;
  localStorage.removeItem(etagKey);
};

/**
 * Invalidate multiple caches
 */
export const invalidateMultipleCaches = (cacheKeys: string[]): void => {
  cacheKeys.forEach(key => invalidateCache(key));
};

/**
 * Set a cache invalidation callback for cross-component communication
 */
export const setCacheInvalidationCallback = (callbackKey: string): void => {
  sessionStorage.setItem('cacheInvalidationCallback', callbackKey);
};

/**
 * Check and clear cache invalidation callback
 */
export const checkAndClearCacheCallback = (expectedKey: string): boolean => {
  const callback = sessionStorage.getItem('cacheInvalidationCallback');
  if (callback === expectedKey) {
    sessionStorage.removeItem('cacheInvalidationCallback');
    return true;
  }
  return false;
};

/**
 * Clear all application caches
 */
export const clearAllCaches = (): void => {
  Object.values(CACHE_KEYS).forEach(key => invalidateCache(key));
  console.log('All application caches cleared');
};

/**
 * Get cache data with timestamp validation
 */
export const getCacheData = <T>(cacheKey: string, maxAge: number = 10 * 60 * 1000): T | null => {
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    const parsed = JSON.parse(cachedData);
    const now = Date.now();
    
    if (now - parsed.timestamp > maxAge) {
      // Cache expired
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error(`Error reading cache ${cacheKey}:`, error);
    localStorage.removeItem(cacheKey);
    return null;
  }
};

/**
 * Set cache data with timestamp
 */
export const setCacheData = <T>(cacheKey: string, data: T, etag?: string): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      etag
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Error setting cache ${cacheKey}:`, error);
  }
};