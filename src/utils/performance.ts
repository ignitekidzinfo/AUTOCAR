/**
 * Performance utilities for optimizing React application performance
 */

// Optimization constants
export const PERFORMANCE_CONSTANTS = {
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 500, // ms
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  LONG_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  PAGE_SIZE: 50, // items per page
  MAX_MEMORY_CACHE_SIZE: 200,
  SCROLL_THROTTLE_DELAY: 150, // ms
};

// Memory cache implementation with LRU (Least Recently Used) eviction policy
export class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly maxSize: number;
  // Track usage order for LRU eviction
  private usageOrder: string[] = [];

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Update usage order for LRU (move to end = most recently used)
    this.updateUsage(key);
    
    return entry.data as T;
  }

  getWithExpiry<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > ttl) {
      this.delete(key);
      return null;
    }
    
    // Update usage order for LRU (move to end = most recently used)
    this.updateUsage(key);
    
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // If key already exists, just update it and its usage
    if (this.cache.has(key)) {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.updateUsage(key);
      return;
    }
    
    // If we're at capacity, evict least recently used item
    if (this.cache.size >= this.maxSize && this.usageOrder.length > 0) {
      const lruKey = this.usageOrder[0]; // First item is least recently used
      this.cache.delete(lruKey);
      this.usageOrder.shift(); // Remove the first element
    }
    
    // Add new item
    this.cache.set(key, { data, timestamp: Date.now() });
    this.usageOrder.push(key); // Add to end (most recently used)
  }

  delete(key: string): void {
    this.cache.delete(key);
    // Remove from usage tracking
    const index = this.usageOrder.indexOf(key);
    if (index !== -1) {
      this.usageOrder.splice(index, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.usageOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
  
  // Helper to update usage order (move key to end = most recently used)
  private updateUsage(key: string): void {
    const index = this.usageOrder.indexOf(key);
    if (index !== -1) {
      this.usageOrder.splice(index, 1);
    }
    this.usageOrder.push(key);
  }
}

// Global memory cache instance
export const globalCache = new MemoryCache(PERFORMANCE_CONSTANTS.MAX_MEMORY_CACHE_SIZE);

/**
 * Two-tier caching strategy (memory + localStorage)
 */
export const cacheManager = {
  get: <T>(key: string, ttl: number = 300000): T | null => {
    try {
      // Try memory cache first (fastest)
      const memoryData = globalCache.getWithExpiry<T>(key, ttl);
      if (memoryData) return memoryData;
      
      // Then check localStorage
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.timestamp && Date.now() - parsed.timestamp < ttl) {
          // Update memory cache for next access
          globalCache.set(key, parsed.data);
          return parsed.data as T;
        } else {
          // Clean expired data
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
      // Clean corrupted data
      try {
        localStorage.removeItem(key);
        globalCache.delete(key);
      } catch {}
    }
    return null;
  },
  
  set: <T>(key: string, data: T): void => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      // Save to memory (fastest)
      globalCache.set(key, data);
      
      // Also save to localStorage (persistent)
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  },
  
  delete: (key: string): void => {
    try {
      localStorage.removeItem(key);
      globalCache.delete(key);
    } catch (e) {
      console.error('Cache delete error:', e);
    }
  },
  
  clearAll: (): void => {
    try {
      globalCache.clear();
      localStorage.clear();
    } catch (e) {
      console.error('Cache clear error:', e);
    }
  }
};

/**
 * Debounce function to limit the rate at which a function can fire
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Function to safely parse JSON with error handling
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
};

/**
 * Batch DOM updates for better performance
 */
export const batchUpdate = (callback: () => void): void => {
  // Use requestAnimationFrame for batching DOM updates
  requestAnimationFrame(() => {
    callback();
  });
};

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  customKeyFn?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = customKeyFn ? customKeyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Create a loading/resource manager
 */
export class ResourceManager {
  private loadingStates = new Map<string, boolean>();
  private retryCounters = new Map<string, number>();
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  
  constructor(maxRetries = 3, retryDelay = 3000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
  
  isLoading(resourceId: string): boolean {
    return this.loadingStates.get(resourceId) || false;
  }
  
  setLoading(resourceId: string, isLoading: boolean): void {
    this.loadingStates.set(resourceId, isLoading);
    
    if (!isLoading) {
      // Reset retry counter when loading completes successfully
      this.retryCounters.delete(resourceId);
    }
  }
  
  shouldRetry(resourceId: string): boolean {
    const retryCount = this.retryCounters.get(resourceId) || 0;
    return retryCount < this.maxRetries;
  }
  
  incrementRetryCount(resourceId: string): number {
    const currentCount = this.retryCounters.get(resourceId) || 0;
    const newCount = currentCount + 1;
    this.retryCounters.set(resourceId, newCount);
    return newCount;
  }
  
  getRetryDelay(resourceId: string): number {
    // Exponential backoff
    const retryCount = this.retryCounters.get(resourceId) || 0;
    return Math.min(this.retryDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }
}

export const globalResourceManager = new ResourceManager();

/**
 * Safe performance measurement utilities
 */
export const safePerformance = {
  /**
   * Safely create a performance mark with error handling
   * @param markName - Name of the mark to create
   * @returns The name of the mark created, or null if failed
   */
  mark: (markName: string): string | null => {
    try {
      // Generate a unique mark name if none provided
      const uniqueMarkName = markName || `mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      performance.mark(uniqueMarkName);
      return uniqueMarkName;
    } catch (error) {
      console.error('Error creating performance mark:', error);
      return null;
    }
  },
  
  /**
   * Safely measure between two marks or from a mark to now
   * @param measureName - Name for the measurement
   * @param startMark - Starting mark name
   * @param endMark - Optional ending mark name (if not provided, measures to now)
   * @returns The duration of the measurement in ms, or null if failed
   */
  measure: (measureName: string, startMark: string, endMark?: string): number | null => {
    try {
      // Check if the start mark exists
      const startMarks = performance.getEntriesByName(startMark, 'mark');
      if (startMarks.length === 0) {
        console.warn(`Start mark "${startMark}" not found for measurement "${measureName}"`);
        return null;
      }
      
      // If endMark provided, check if it exists
      if (endMark) {
        const endMarks = performance.getEntriesByName(endMark, 'mark');
        if (endMarks.length === 0) {
          console.warn(`End mark "${endMark}" not found for measurement "${measureName}"`);
          return null;
        }
      }
      
      // Create the measurement
      if (endMark) {
        performance.measure(measureName, startMark, endMark);
      } else {
        performance.measure(measureName, startMark);
      }
      
      // Get the measurement result
      const measurements = performance.getEntriesByName(measureName, 'measure');
      if (measurements.length > 0) {
        return measurements[0].duration;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating performance measurement:', error);
      return null;
    }
  },
  
  /**
   * Safely clear performance marks and measures
   * @param markName - Optional mark name to clear (if not provided, clears all)
   * @param measureName - Optional measure name to clear (if not provided, clears all)
   */
  clear: (markName?: string, measureName?: string): void => {
    try {
      if (markName) {
        performance.clearMarks(markName);
      } else {
        performance.clearMarks();
      }
      
      if (measureName) {
        performance.clearMeasures(measureName);
      } else if (!markName) {
        performance.clearMeasures();
      }
    } catch (error) {
      console.error('Error clearing performance entries:', error);
    }
  }
}; 