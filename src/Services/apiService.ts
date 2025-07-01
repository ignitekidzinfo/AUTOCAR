import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import storageUtils from '../utils/storageUtils';

// Advanced cache configuration
interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Enable SWR pattern
  forceRefresh?: boolean; // Force refresh from server
  cacheGroup?: string; // Group for batch invalidation
  batchKey?: string; // Key for request batching
}

interface CacheEntry {
  data: any;
  timestamp: number;
  staleTimestamp: number; // When data becomes stale
  promise?: Promise<any>; // For in-flight requests
  etag?: string; // For conditional requests
}

interface BatchRequestMap {
  [key: string]: {
    promise: Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    requestIds: string[];
    timer: NodeJS.Timeout;
  }
}

// Cache configuration constants
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 min
const DEFAULT_STALE_TTL = 30 * 60 * 1000; // 30 min
const BATCH_DELAY = 50; // ms to wait for batching similar requests

// Advanced performance-optimized in-memory cache with LRU capabilities
class OptimizedCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheGroups: Map<string, Set<string>> = new Map();
  private readonly maxSize: number;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private batchRequests: BatchRequestMap = {};
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }
  
  // Get an item from cache with SWR support
  get<T>(key: string): { data: T | null, stale: boolean, promise: Promise<T> | null } {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { data: null, stale: false, promise: null };
    }
    
    const now = Date.now();
    const stale = now > entry.staleTimestamp;
    
    return {
      data: entry.data,
      stale,
      promise: entry.promise || null
    };
  }
  
  // Set an item in cache with proper TTL
  set(key: string, data: any, options: Partial<CacheOptions> = {}): void {
    const now = Date.now();
    const ttl = options.ttl || DEFAULT_CACHE_TTL;
    
    // Check if we need to evict the oldest item
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Add to cache group if specified
    if (options.cacheGroup) {
      if (!this.cacheGroups.has(options.cacheGroup)) {
        this.cacheGroups.set(options.cacheGroup, new Set());
      }
      this.cacheGroups.get(options.cacheGroup)?.add(key);
    }
    
    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      staleTimestamp: now + ttl,
      etag: data.headers?.etag
    });
  }
  
  // Delete a specific cache entry
  delete(key: string): boolean {
    // Also remove from any groups
    for (const [groupName, keys] of this.cacheGroups.entries()) {
      if (keys.has(key)) {
        keys.delete(key);
        if (keys.size === 0) {
          this.cacheGroups.delete(groupName);
        }
      }
    }
    
    return this.cache.delete(key);
  }
  
  // Clear entire cache or specific group
  clear(cacheGroup?: string): void {
    if (cacheGroup) {
      const keys = this.cacheGroups.get(cacheGroup);
      if (keys) {
        for (const key of keys) {
          this.cache.delete(key);
        }
        this.cacheGroups.delete(cacheGroup);
      }
    } else {
      this.cache.clear();
      this.cacheGroups.clear();
    }
  }
  
  // Check if we have a cached request
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  // Set a pending request to avoid duplicates
  setPending(key: string, promise: Promise<any>): void {
    this.pendingRequests.set(key, promise);
  }
  
  // Get a pending request
  getPending(key: string): Promise<any> | undefined {
    return this.pendingRequests.get(key);
  }
  
  // Remove a pending request
  removePending(key: string): boolean {
    return this.pendingRequests.delete(key);
  }
  
  // Add a request to batch
  addToBatch(batchKey: string, requestId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!this.batchRequests[batchKey]) {
        // Create a new batch
        const timer = setTimeout(() => {
          // Time to execute the batch
          this.executeBatch(batchKey);
        }, BATCH_DELAY);
        
        this.batchRequests[batchKey] = {
          promise: null as any,
          resolve: null as any,
          reject: null as any,
          requestIds: [requestId],
          timer
        };
        
        this.batchRequests[batchKey].promise = new Promise((res, rej) => {
          this.batchRequests[batchKey].resolve = res;
          this.batchRequests[batchKey].reject = rej;
        });
      } else {
        // Add to existing batch
        this.batchRequests[batchKey].requestIds.push(requestId);
      }
      
      // Return a promise that will resolve when the batch completes
      this.batchRequests[batchKey].promise.then(
        (results) => resolve(results[requestId]),
        (error) => reject(error)
      );
    });
  }
  
  // Execute a batch of requests
  private executeBatch(batchKey: string): void {
    // This would need to be implemented based on your API's batching support
    // This is a placeholder for the actual implementation
    // The server would need to support a batch endpoint
  }
}

// Initialize the optimized cache
const apiCache = new OptimizedCache(200);

const API_BASE_URL = 'https://sp80.prodchunca.in.net';
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// API request cache system
const CACHE_DURATION = 5 * 60 * 1000; 

// Create the advanced axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Generate a cache key from request config
function generateCacheKey(config: AxiosRequestConfig): string {
  const { method, url, params, data } = config;
  return `${method}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`;
}

// Request interceptor for caching and deduplication
apiClient.interceptors.request.use(
  async (config) => {
    // Skip caching for non-GET requests unless explicitly enabled
    if (config.method !== 'get' && !config.headers?.['use-cache']) {
      return config;
    }
    
    // Extract cache options
    const cacheOptionsStr = config.headers?.['cache-options'] as string;
    const cacheOptions: CacheOptions = cacheOptionsStr 
      ? JSON.parse(cacheOptionsStr)
      : {} as CacheOptions;
    
    delete config.headers?.['cache-options']; // Clean up
    
    // Generate cache key
    const cacheKey = generateCacheKey(config);
    
    // Check for batch request capability
    if (cacheOptions.batchKey && config.method === 'get') {
      const batchPromise = apiCache.addToBatch(
        cacheOptions.batchKey, 
        cacheKey
      );
      
      // Convert to a canceled request since batching will handle it
      // This is a pattern to short-circuit Axios
      return {
        ...config,
        adapter: () => batchPromise
      };
    }
    
    // Request deduplication - check if this exact request is already in-flight
    const pendingRequest = apiCache.getPending(cacheKey);
    if (pendingRequest) {
      // Return the existing promise to avoid duplicate requests
      return {
        ...config,
        adapter: () => pendingRequest
      };
    }
    
    // Check cache for this request
    const { data: cachedData, stale } = apiCache.get(cacheKey);
    
    // Force refresh or no cached data available
    if (cacheOptions.forceRefresh || !cachedData) {
      return config;
    }
    
    // We have valid, non-stale cached data
    if (!stale) {
      // Return cached data without making a new request
      return {
        ...config,
        adapter: () => Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        })
      };
    }
    
    // We have stale data and SWR is enabled
    if (stale && cacheOptions.staleWhileRevalidate) {
      // Use stale data but trigger background refresh
      setTimeout(() => {
        // Clone the config but force a refresh
        const refreshConfig = {
          ...config,
          headers: {
            ...config.headers,
            'cache-control': 'no-cache'
          }
        };
        apiClient.request(refreshConfig).catch(console.error); // Silently refresh
      }, 0);
      
      // Return the stale data immediately
      return {
        ...config,
        adapter: () => Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (stale)',
          headers: { 'from-cache': 'true', 'stale-data': 'true' },
          config,
          request: {}
        })
      };
    }
    
    // Add If-None-Match header for conditional requests if we have an ETag
    if (cachedData && typeof cachedData === 'object' && 'etag' in cachedData && cachedData.etag) {
      // For Axios types compatibility, type assertion is needed
      // This is safe because we're just setting a header value on the existing object
      const headers = config.headers || {};
      headers['If-None-Match'] = cachedData.etag;
      config.headers = headers as typeof config.headers;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for caching
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Only cache GET requests by default
    if (response.config.method === 'get' || response.config.headers?.['use-cache']) {
      // Extract and parse cache options
      const cacheOptionsStr = response.config.headers?.['cache-options'] as string;
      const cacheOptions: CacheOptions = cacheOptionsStr 
        ? JSON.parse(cacheOptionsStr) 
        : {} as CacheOptions;
      
      // Generate cache key
      const cacheKey = generateCacheKey(response.config);
      
      // Cache the response
      apiCache.set(cacheKey, response.data, {
        ttl: cacheOptions.ttl || DEFAULT_CACHE_TTL,
        cacheGroup: cacheOptions.cacheGroup
      });
      
      // Remove from pending requests
      apiCache.removePending(cacheKey);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // If we got a 304 Not Modified, return the cached data
    if (error.response?.status === 304) {
      const cacheKey = generateCacheKey(error.config!);
      const { data } = apiCache.get(cacheKey);
      
      if (data) {
        return Promise.resolve({
          data,
          status: 200,
          statusText: 'OK (cached)',
          headers: { 'from-cache': 'true' },
          config: error.config!,
          request: error.request
        });
      }
    }
    
    // Handle expired token error
    if (error.response?.status === 401) {
      // Get message from the response data
      const responseData = error.response?.data as Record<string, any>;
      const errorMessage = responseData?.message || 'Your session has expired. Please login again.';
      
      // Dispatch token expiration event
      const event = new CustomEvent('token-expired', { 
        detail: { message: errorMessage }
      });
      document.dispatchEvent(event);
    }
    
    // Clean up any pending request
    if (error.config) {
      const cacheKey = generateCacheKey(error.config);
      apiCache.removePending(cacheKey);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to invalidate cache by group
export function invalidateCache(cacheGroup?: string) {
  apiCache.clear(cacheGroup);
}

// Utility function to pre-fetch and cache endpoints
export async function prefetchEndpoints(endpoints: string[], cacheGroup?: string) {
  const prefetchPromises = endpoints.map(endpoint => 
    apiClient.get(endpoint, {
      headers: {
        'cache-options': JSON.stringify({
          ttl: DEFAULT_CACHE_TTL,
          cacheGroup
        })
      }
    }).catch(err => {
      console.warn(`Failed to prefetch ${endpoint}:`, err);
      return null;
    })
  );
  
  return Promise.all(prefetchPromises);
}

// Utility function to batch requests
export async function batchRequests<T>(requests: Array<{endpoint: string, params?: any}>, batchKey: string): Promise<T[]> {
  const batchPromises = requests.map(({ endpoint, params }) => 
    apiClient.get(endpoint, {
      params,
      headers: {
        'cache-options': JSON.stringify({
          batchKey,
          ttl: DEFAULT_CACHE_TTL
        })
      }
    })
  );
  
  return Promise.all(batchPromises).then(responses => responses.map(r => r.data));
}

export default apiClient;
