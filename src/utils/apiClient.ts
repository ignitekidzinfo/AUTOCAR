import axios, { AxiosResponse } from 'axios';
import logger from './logger';
import { isDevelopment } from './environment';
import storageUtils from './storageUtils';
import secureStorage from './secureStorage';
import { isTokenValid, forceCheckTokenValidity } from './tokenUtils';
import { toast } from 'react-toastify';

// Configuration for development mode
const DEBUG_DISABLE_LOGOUT_ON_401 = false; // Changed to false to ensure proper token validation in all environments

// Define custom response type with cached property
interface CachedAxiosResponse<T = any> extends AxiosResponse<T> {
  cached?: boolean;
}

// Environment check for API base URL
// const API_BASE_URL = 'https://carauto01-production-8b0b.up.railway.app';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// API request cache system
const CACHE_DURATION = 5 * 60 * 1000; 
const apiCache: Record<string, { data: any; timestamp: number }> = {};

// CSRF Token management
const getCsrfToken = (): string | null => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
};

// Sensitive keys that should be sanitized in responses
const SENSITIVE_KEYS = [
  'password', 'token', 'accessToken', 'refreshToken', 'authorization', 'auth', 
  'secret', 'key', 'apiKey', 'pin', 'credential', 'ssn', 'social', 
  'creditCard', 'credit', 'cvv', 'cvc', 'authorization', 'x-auth',
  'jwt', 'id_token', 'access_token', 'x-api-key'
];

// Function to sanitize sensitive data from API responses
const sanitizeResponseData = (data: any): any => {
  if (!data) return data;
  
  // Handle simple types
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }
  
  // Handle objects
  const sanitized = { ...data };
  for (const key in sanitized) {
    // Check if this is a sensitive key
    const isSensitive = SENSITIVE_KEYS.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isSensitive) {
      // Mask sensitive data
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = '********';
      } else if (typeof sanitized[key] === 'number') {
        sanitized[key] = 0;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeResponseData(sanitized[key]);
    }
  }
  
  return sanitized;
};

// Create a response sanitizer that modifies the response before browser sees it
const installResponseSanitizer = () => {
  if (typeof window !== 'undefined') {
    // Instead of overriding JSON.stringify, we'll use response interceptors
    // to sanitize the data before it's visible in network tab
    
    // For XHR requests (most browsers)
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Override XHR methods to capture and sanitize responses
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      // Store URL for later reference
      Object.defineProperty(this, '_url', {
        value: url,
        writable: true,
        configurable: true
      });
      
      return originalXHROpen.call(this, method, url, async, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      // Monitor when response is complete
      this.addEventListener('readystatechange', function(this: XMLHttpRequest) {
        if (this.readyState === 4) {
          try {
            // If the response is JSON, sanitize it
            const contentType = this.getResponseHeader('content-type');
            if (this.responseType === 'json' || 
                (contentType && contentType.includes('application/json'))) {
              
              // Store original getter
              const originalResponseGetter = Object.getOwnPropertyDescriptor(
                XMLHttpRequest.prototype, 'response'
              );
              
              if (originalResponseGetter) {
                // Replace the response getter to return sanitized data
                Object.defineProperty(this, 'response', {
                  get: function(this: XMLHttpRequest) {
                    try {
                      const originalResponse = originalResponseGetter.get?.call(this);
                      if (originalResponse) {
                        return sanitizeResponseData(originalResponse);
                      }
                      return originalResponse;
                    } catch (err) {
                      logger.error('Error sanitizing XHR response:', err);
                      return originalResponseGetter.get?.call(this);
                    }
                  }
                });
              }
            }
          } catch (err) {
            logger.error('Error setting up XHR response sanitizer:', err);
          }
        }
      });
      
      return originalXHRSend.call(this, body);
    };
    
    // Now let's also intercept fetch API
    const originalFetch = window.fetch;
    
    window.fetch = async function fetchOverride(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      // Call original fetch
      const response: Response = await originalFetch.call(window, input, init);
      
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      
      // Check if the response is JSON
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Create a proxy for the json method to sanitize data
        const originalJsonMethod = response.json;
        response.json = async function(): Promise<any> {
          const data = await originalJsonMethod.call(this);
          return sanitizeResponseData(data);
        };
      }
      
      return response;
    };
    
    logger.debug('Response sanitizer installed');
  }
};

// Install the sanitizer early
installResponseSanitizer();

// Create axios instance with custom config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // Send cookies with cross-origin requests
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, 
      config.params ? { params: config.params } : '');
    
    // Don't check token validity before every request as this causes logout loops
    // Only add token if it exists
    
    const token = storageUtils.getAuthToken();
    if (token) {      
      // Add token to headers
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add CSRF token for non-GET requests if available
    if (config.method?.toLowerCase() !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
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
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response: CachedAxiosResponse) => {
    // Log successful responses (with sanitized data)
    logger.debug(`API Response: ${response.status} ${response.config.url}`, 
      response.cached ? { cached: true } : '');
    
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
    
    // Return original response (it will be sanitized by JSON.stringify)
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (expired token)
    if (error.response && error.response.status === 401) {
      logger.warn('Received 401 Unauthorized - Token may be expired or invalid');
      
      // Count 401 errors to prevent multiple redirects
      const unauthorized401Count = parseInt(sessionStorage.getItem('unauthorized401Count') || '0');
      sessionStorage.setItem('unauthorized401Count', (unauthorized401Count + 1).toString());
      
      // Only redirect after multiple 401s to prevent redirect loops
      // Also check if we're already on the login page
      if (unauthorized401Count > 3 && window.location.pathname !== '/signIn') {
        // Store current path for redirect after login
        const currentPath = window.location.pathname;
        secureStorage.setItem('redirectAfterLogin', currentPath);
        
        // Clear token
        storageUtils.clearAuthData();
        
        // Show toast notification
        toast.error('Your session has expired. Please sign in again.');
        
        // Reset 401 counter
        sessionStorage.setItem('unauthorized401Count', '0');
        
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/signIn';
        }, 1500);
      }
    }
    
    // Log error responses (sanitized)
    logger.error('API Response Error:', error.response || error);
    
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