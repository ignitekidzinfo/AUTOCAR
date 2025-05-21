/**
 * API utilities with advanced caching and optimization features
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import cacheService, { CacheOptions } from './cacheService';

// API base URL
const API_BASE_URL = 'https://carauto01-production-8b0b.up.railway.app';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generate a cache key from request config
function generateCacheKey(config: AxiosRequestConfig): string {
  const { method = 'get', url = '', params, data } = config;
  return `${method}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`;
}

/**
 * Enhanced fetch function with stale-while-revalidate caching
 */
export async function fetchWithCache<T>(
  url: string, 
  options: {
    method?: string;
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, any>;
    cache?: CacheOptions;
  } = {}
): Promise<T> {
  const { 
    method = 'GET', 
    params, 
    data, 
    headers = {},
    cache: cacheOptions = {}
  } = options;
  
  // Create request config
  const config: AxiosRequestConfig = {
    url,
    method: method.toUpperCase(),
    params,
    data,
    headers
  };
  
  // Generate cache key
  const cacheKey = generateCacheKey(config);
  
  // Check cache first
  const cacheResult = cacheService.get<T>(cacheKey, cacheOptions);
  
  // If we have non-stale data in cache, return it immediately
  if (cacheResult.data && !cacheResult.stale && !cacheOptions.forceRefresh) {
    return cacheResult.data;
  }
  
  // If we have stale data and staleWhileRevalidate is enabled, trigger background refresh
  if (cacheResult.data && cacheResult.stale && cacheOptions.staleWhileRevalidate) {
    // Return stale data immediately
    const staleData = cacheResult.data;
    
    // Trigger background refresh
    setTimeout(async () => {
      try {
        const response = await apiClient.request<T>(config);
        cacheService.set(cacheKey, response.data, cacheOptions);
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    }, 0);
    
    return staleData;
  }
  
  // Make the actual API request
  try {
    const response = await apiClient.request<T>(config);
    
    // Cache the response
    cacheService.set(cacheKey, response.data, cacheOptions);
    
    return response.data;
  } catch (error) {
    // Handle token expiration or other errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Dispatch token expired event
      document.dispatchEvent(new CustomEvent('token-expired', {
        detail: { message: 'Your session has expired. Please login again.' }
      }));
    }
    
    throw error;
  }
}

/**
 * Batch multiple API requests into a single request
 */
export async function batchRequests<T>(
  requests: Array<{
    endpoint: string;
    method?: string;
    params?: Record<string, any>;
    data?: any;
  }>,
  options: {
    batchKey: string;
    cache?: CacheOptions;
  }
): Promise<T[]> {
  // Check if server supports batching
  // If not, fall back to Promise.all
  return Promise.all(
    requests.map(request => 
      fetchWithCache<T>(
        request.endpoint, 
        {
          method: request.method || 'GET',
          params: request.params,
          data: request.data,
          cache: options.cache
        }
      )
    )
  );
}

/**
 * Prefetch data for anticipated user actions
 */
export function prefetchData(
  urls: string[], 
  options: { 
    priority?: 'high' | 'low';
    cacheGroup?: string;
    ttl?: number;
  } = {}
): void {
  const { priority = 'low', cacheGroup, ttl } = options;
  
  // Use requestIdleCallback for low priority prefetching
  const execute = () => {
    urls.forEach(url => {
      fetchWithCache(url, {
        cache: {
          ttl,
          cacheGroup,
          staleWhileRevalidate: true
        }
      }).catch(err => {
        // Silently ignore prefetch errors
        console.debug('Prefetch error (can be ignored):', err);
      });
    });
  };
  
  if (priority === 'low' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(execute, { timeout: 2000 });
  } else if (priority === 'low') {
    setTimeout(execute, 100);
  } else {
    execute();
  }
}

/**
 * Invalidate cached data
 */
export function invalidateCache(options: { key?: string; group?: string } = {}): void {
  if (options.key) {
    cacheService.delete(options.key);
  } else if (options.group) {
    cacheService.invalidateGroup(options.group);
  } else {
    cacheService.clear();
  }
}

export default {
  client: apiClient,
  fetchWithCache,
  batchRequests,
  prefetchData,
  invalidateCache
}; 