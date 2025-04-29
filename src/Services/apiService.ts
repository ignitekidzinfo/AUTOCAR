import axios, { AxiosResponse } from 'axios';
import storageUtils from '../utils/storageUtils';

// Define custom response type with cached property
interface CachedAxiosResponse<T = any> extends AxiosResponse<T> {
  cached?: boolean;
}

// Environment check for API base URL
const API_BASE_URL = 'https://carauto01-production-8b0b.up.railway.app';
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// API request cache system
const CACHE_DURATION = 5 * 60 * 1000; 
const apiCache: Record<string, { data: any; timestamp: number }> = {};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available - using storageUtils instead of localStorage
    const token = storageUtils.getAuthToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Check if it's a GET request and we should use cache
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.forceRefresh) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = apiCache[cacheKey];
      
      // Use cache if it exists and is still valid
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        // Set a flag on the config to indicate we're using cached data
        config.adapter = () => {
          return Promise.resolve({
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: null,
            cached: true
          } as CachedAxiosResponse);
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for caching
apiClient.interceptors.response.use(
  (response: CachedAxiosResponse) => {
    // Skip caching if response is already from cache
    if (response.config.method?.toLowerCase() === 'get' && 
        response.config.url && 
        !response.config.params?.forceRefresh && 
        !response.cached) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      
      // Store the response in the cache
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
    }
    
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.warn('Received 401 Unauthorized - Token may be expired or invalid');
      
      // Option to redirect to login page
      // window.location.href = '/signIn';
    }
    
    return Promise.reject(error);
  }
);

// Utility to force refresh a cached GET request
export const forceRefresh = (url: string, params = {}) => {
  return apiClient.get(url, { 
    params: { 
      ...params,
      forceRefresh: true,
      _t: Date.now() // Add timestamp to prevent browser caching
    } 
  });
};

// Utility to clear entire cache or specific cache entries
export const clearCache = (url?: string, params = {}) => {
  if (url) {
    // Clear specific cache entry
    const cacheKey = `${url}${JSON.stringify(params || {})}`;
    delete apiCache[cacheKey];
  } else {
    // Clear entire cache
    Object.keys(apiCache).forEach(key => {
      delete apiCache[key];
    });
  }
};

export default apiClient;
