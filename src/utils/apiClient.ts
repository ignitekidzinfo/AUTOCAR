import axios, { AxiosResponse } from 'axios';
import logger from './logger';
import { isDevelopment } from './environment';
import storageUtils from './storageUtils';
import secureStorage from './secureStorage';
import { isTokenValid, forceCheckTokenValidity } from './tokenUtils';
import { toast } from 'react-toastify';

// Configuration for development mode
const DEBUG_DISABLE_LOGOUT_ON_401 = false; 

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
   
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      Object.defineProperty(this, '_url', {
        value: url,
        writable: true,
        configurable: true
      });
      
      return originalXHROpen.call(this, method, url, async, username, password);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      
      this.addEventListener('readystatechange', function(this: XMLHttpRequest) {
        if (this.readyState === 4) {
          try {
            const contentType = this.getResponseHeader('content-type');
            if (this.responseType === 'json' || 
                (contentType && contentType.includes('application/json'))) {
              
              const originalResponseGetter = Object.getOwnPropertyDescriptor(
                XMLHttpRequest.prototype, 'response'
              );
              
              if (originalResponseGetter) {
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
    
    const originalFetch = window.fetch;
    
    window.fetch = async function fetchOverride(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const response: Response = await originalFetch.call(window, input, init);
      
      const clonedResponse = response.clone();
      
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
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
installResponseSanitizer();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
  withCredentials: true, 
});

apiClient.interceptors.request.use(
  (config) => {
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, 
      config.params ? { params: config.params } : '');
    
    const token = storageUtils.getAuthToken();
    if (token) {      
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    if (config.method?.toLowerCase() !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.forceRefresh) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = apiCache[cacheKey];
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
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

apiClient.interceptors.response.use(
  (response: CachedAxiosResponse) => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`, 
      response.cached ? { cached: true } : '');
    
    if (response.config.method?.toLowerCase() === 'get' && 
        response.config.url && 
        !response.config.params?.forceRefresh && 
        !response.cached) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
    }
    
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      logger.warn('Received 401 Unauthorized - Token may be expired or invalid');
      
      const unauthorized401Count = parseInt(sessionStorage.getItem('unauthorized401Count') || '0');
      sessionStorage.setItem('unauthorized401Count', (unauthorized401Count + 1).toString());
      
      if (unauthorized401Count > 3 && window.location.pathname !== '/signIn') {
    
        const currentPath = window.location.pathname;
        secureStorage.setItem('redirectAfterLogin', currentPath);
        
        storageUtils.clearAuthData();
        
        toast.error('Your session has expired. Please sign in again.');
        
        sessionStorage.setItem('unauthorized401Count', '0');
        
        setTimeout(() => {
          window.location.href = '/signIn';
        }, 1500);
      }
    }
    
    logger.error('API Response Error:', error.response || error);
    
    return Promise.reject(error);
  }
);

export const forceRefresh = (url: string, params = {}) => {
  return apiClient.get(url, { 
    params: { 
      ...params,
      forceRefresh: true,
      _t: Date.now() 
    } 
  });
};

export const clearCache = (url?: string, params = {}) => {
  if (url) {
    const cacheKey = `${url}${JSON.stringify(params || {})}`;
    delete apiCache[cacheKey];
  } else {
    Object.keys(apiCache).forEach(key => {
      delete apiCache[key];
    });
  }
};

export default apiClient; 