/**
 * CacheService - Consistent caching implementation
 * 
 * Implements stale-while-revalidate pattern and provides a consistent
 * caching API across the entire application.
 */

// Cache entry interface for type safety
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTimestamp: number;
  etag?: string;
}

// Cache options interface
export interface CacheOptions {
  ttl?: number; // Time to live (in ms)
  staleWhileRevalidate?: boolean; // Use stale data while fetching fresh data
  forceRefresh?: boolean; // Bypass cache and force fresh data
  cacheGroup?: string; // Group for batch invalidation
}

// Cache result interface
export interface CacheResult<T> {
  data: T | null;
  stale: boolean;
  fromCache: boolean;
}

/**
 * Cache implementation with memory and localStorage persistence
 */
class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private cacheGroups: Map<string, Set<string>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private cacheVersion: number;
  
  constructor(options: { maxSize?: number; defaultTTL?: number } = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.cacheVersion = Date.now();
    
    // Set up event listener to detect changes from other components
    document.addEventListener('cacheInvalidation', (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.group) {
        this.invalidateGroup(customEvent.detail.group);
      } else if (customEvent.detail?.key) {
        this.delete(customEvent.detail.key);
      } else {
        this.clear();
      }
    });
  }
  
  /**
   * Get an item from cache with stale-while-revalidate support
   */
  get<T>(key: string, options: CacheOptions = {}): CacheResult<T> {
    // Try memory cache first (fastest)
    const memoryCached = this.memoryCache.get(key);
    
    // Get from localStorage if not in memory
    let entry: CacheEntry<T> | null = null;
    
    if (memoryCached) {
      entry = memoryCached as CacheEntry<T>;
      console.debug(`Memory cache hit: ${key}`);
    } else {
      try {
        const localStorageItem = localStorage.getItem(`cache_${key}`);
        if (localStorageItem) {
          const parsedItem = JSON.parse(localStorageItem);
          
          // Check version to ensure we're not using stale data after app updates
          if (parsedItem.version === this.cacheVersion) {
            entry = parsedItem.entry;
            // Add to memory cache for future fast access
            if (entry !== null) {
              this.memoryCache.set(key, entry);
              console.debug(`LocalStorage cache hit: ${key}`);
            }
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        // Clean up potentially corrupted data
        this.delete(key);
      }
    }
    
    // Return null if not found or force refresh is requested
    if (!entry || options.forceRefresh) {
      return { data: null, stale: false, fromCache: false };
    }
    
    const now = Date.now();
    const stale = now > entry.staleTimestamp;
    
    return {
      data: entry.data,
      stale,
      fromCache: true
    };
  }
  
  /**
   * Set an item in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    
    // Create cache entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      staleTimestamp: now + ttl,
      etag: typeof data === 'object' && data !== null && 'etag' in data 
        ? (data as any).etag 
        : undefined
    };
    
    // Evict oldest entry if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    
    // Add to memory cache
    this.memoryCache.set(key, entry);
    
    // Add to cache group if specified
    if (options.cacheGroup) {
      if (!this.cacheGroups.has(options.cacheGroup)) {
        this.cacheGroups.set(options.cacheGroup, new Set());
      }
      this.cacheGroups.get(options.cacheGroup)?.add(key);
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        entry,
        version: this.cacheVersion
      }));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      
      // Try to free space by removing old entries
      this.clearOldLocalStorageEntries();
    }
  }
  
  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    // Remove from memory cache
    const memoryResult = this.memoryCache.delete(key);
    
    // Remove from cache groups
    for (const [groupName, keys] of this.cacheGroups.entries()) {
      if (keys.has(key)) {
        keys.delete(key);
        if (keys.size === 0) {
          this.cacheGroups.delete(groupName);
        }
      }
    }
    
    // Remove from localStorage
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
    
    // Notify other components
    this.notifyChange({ key });
    
    return memoryResult;
  }
  
  /**
   * Invalidate a group of cache entries
   */
  invalidateGroup(group: string): void {
    const keys = this.cacheGroups.get(group);
    if (keys) {
      for (const key of keys) {
        // Only remove from memory and localStorage, not from groups yet
        this.memoryCache.delete(key);
        try {
          localStorage.removeItem(`cache_${key}`);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
      // Clear the group
      this.cacheGroups.delete(group);
    }
    
    // Notify other components
    this.notifyChange({ group });
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();
    this.cacheGroups.clear();
    
    // Clear localStorage (only our entries)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Update version to invalidate any cached data
    this.cacheVersion = Date.now();
    
    // Notify other components
    this.notifyChange({});
  }
  
  /**
   * Check if entry exists in cache
   */
  has(key: string): boolean {
    return this.memoryCache.has(key) || localStorage.getItem(`cache_${key}`) !== null;
  }
  
  /**
   * Clear oldest localStorage entries to make space
   */
  private clearOldLocalStorageEntries(): void {
    try {
      const cacheKeys: Array<{ key: string; timestamp: number }> = [];
      
      // Collect all cache keys with timestamps
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              cacheKeys.push({
                key,
                timestamp: parsed.entry?.timestamp || 0
              });
            } catch {
              // If we can't parse, consider it old and add to deletion candidates
              cacheKeys.push({ key, timestamp: 0 });
            }
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 20% of entries
      const deleteCount = Math.ceil(cacheKeys.length * 0.2);
      for (let i = 0; i < deleteCount && i < cacheKeys.length; i++) {
        localStorage.removeItem(cacheKeys[i].key);
      }
    } catch (error) {
      console.error('Error clearing old localStorage entries:', error);
    }
  }
  
  /**
   * Notify other components about cache changes
   */
  private notifyChange(detail: { key?: string; group?: string }): void {
    document.dispatchEvent(new CustomEvent('cacheInvalidation', { detail }));
  }
}

// Create and export singleton instance
export const cacheService = new CacheService({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000 // 5 minutes
});

export default cacheService; 