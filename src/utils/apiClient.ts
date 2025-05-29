import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from './logger';
import storageUtils from './storageUtils';
import { cacheManager } from './performance';

const DEBUG_DISABLE_LOGOUT_ON_401 = false; 

interface CachedAxiosResponse<T = any> extends AxiosResponse<T> {
  cached?: boolean;
}

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  __throttled?: boolean;
  __throttleDelay?: number;
  __retryCount?: number;
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __throttled?: boolean;
    __throttleDelay?: number;
    __retryCount?: number;
  }
}

// const API_BASE_URL = 'https://carauto01-production-8b0b.up.railway.app';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const CACHE_DURATION = 5 * 60 * 1000; 
const apiCache: Record<string, { data: any; timestamp: number }> = {};

const getCsrfToken = (): string | null => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  return token || storageUtils.getItem('csrfToken');
};

const SENSITIVE_KEYS = [
  'password', 'token', 'accessToken', 'refreshToken', 'authorization', 'auth', 
  'secret', 'key', 'apiKey', 'pin', 'credential', 'ssn', 'social', 
  'creditCard', 'credit', 'cvv', 'cvc', 'authorization', 'x-auth',
  'jwt', 'id_token', 'access_token', 'x-api-key'
];

const sanitizeResponseData = (data: any): any => {
  if (!data) return data;
  
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }
  
  const sanitized = { ...data };
  for (const key in sanitized) {
    const isSensitive = SENSITIVE_KEYS.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isSensitive) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = '********';
      } else if (typeof sanitized[key] === 'number') {
        sanitized[key] = 0;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeResponseData(sanitized[key]);
    }
  }
  
  return sanitized;
};

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

const createApiClient = (): AxiosInstance => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  
  const client = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br', // Support compression
      'Connection': 'keep-alive', // Enable connection reuse
      'X-HTTP-Version': 'HTTP/2.0', // Signal HTTP/2 support
    },
    timeout: 30000, // 30 seconds timeout
    // Enable HTTP/2 multiplexing via adapter config
    httpAgent: false, // Let Axios select appropriate agent
    httpsAgent: false, // Let Axios select appropriate agent
    decompress: true, // Enable automatic decompression
    // Performance optimizations
    maxContentLength: 10 * 1024 * 1024, // 10MB max content size
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 500, // Handle 4xx errors in code
  });

  // Configure request batching and debouncing
  const pendingRequests = new Map<string, Promise<any>>();
  const requestTimestamps = new Map<string, number>();

  // Request throttling configuration
  const THROTTLE_INTERVAL = 50; // ms between requests to same endpoint
  const MAX_CONCURRENT_REQUESTS = 6; // Typical browser connection limit
  let activeRequests = 0;
  let requestQueue: Array<() => void> = [];

  // Set up request queuing to avoid overwhelming browser connection limits
  const executeQueuedRequests = () => {
    while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
      const nextRequest = requestQueue.shift();
      if (nextRequest) {
        activeRequests++;
        nextRequest();
      }
    }
  };

  // Add request interceptor with HTTP/2 optimizations
  client.interceptors.request.use(
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
      
      // Implement HTTP/2 request multiplexing optimization
      const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
      
      // Return from cache if available for GET requests
      if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.forceRefresh) {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        const cachedResponse = apiCache[cacheKey];
        
        if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
          config.adapter = () => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK',
              headers: {
                'x-cache': 'HIT',
                'content-type': 'application/json'
              },
              config,
              request: null,
              cached: true
            } as CachedAxiosResponse);
          };
        }
        
        // Check for in-flight requests to the same endpoint
        const pendingRequest = pendingRequests.get(requestKey);
        if (pendingRequest && !config.params?.bypassDeduplication) {
          logger.debug(`Reusing in-flight request for ${requestKey}`);
          config.adapter = () => pendingRequest.then(response => ({...response, cached: true}));
        }
      }
      
      // Implement request throttling for same endpoints
      const lastRequestTime = requestTimestamps.get(requestKey) || 0;
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      
      // Cast config to our extended type
      const extendedConfig = config as ExtendedAxiosRequestConfig;
      
      if (timeSinceLastRequest < THROTTLE_INTERVAL) {
        // Throttle requests to same endpoint
        const delay = THROTTLE_INTERVAL - timeSinceLastRequest;
        extendedConfig.__throttled = true;
        extendedConfig.__throttleDelay = delay;
        
        // Add artificial delay for throttled requests
        const originalAdapter = config.adapter;
        config.adapter = (axiosConfig) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // Use the original adapter if available, or let Axios handle it
              if (typeof originalAdapter === 'function') {
                resolve(originalAdapter(axiosConfig));
              } else {
                // Remove the adapter and let Axios use the default one
                const configWithDefaultAdapter = { ...axiosConfig };
                delete configWithDefaultAdapter.adapter;
                resolve(axios(configWithDefaultAdapter));
              }
            }, delay);
          });
        };
      }
      
      // Update request timestamp
      requestTimestamps.set(requestKey, Date.now());
      
      // Handle queue if we're at connection limit
      if (activeRequests >= MAX_CONCURRENT_REQUESTS && !config.params?.priority) {
        return new Promise((resolve) => {
          requestQueue.push(() => resolve(config));
        }) as any;
      }
      
      // Increase active requests count for non-cached requests
      if (!config.adapter) {
        activeRequests++;
      }
      
      return config;
    },
    (error) => {
      logger.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor with compression detection
  client.interceptors.response.use(
    (response: CachedAxiosResponse) => {
      // Track request completion to maintain connection limits
      activeRequests = Math.max(0, activeRequests - 1);
      executeQueuedRequests();
      
      // Detect if response was compressed
      const contentEncoding = response.headers['content-encoding'];
      const wasCompressed = contentEncoding && 
                           ['gzip', 'deflate', 'br'].includes(contentEncoding.toLowerCase());
      
      if (wasCompressed) {
        logger.debug(`Received compressed response (${contentEncoding}) for ${response.config.url}`);
      }
      
      // Cache GET responses that aren't already from cache
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

        // Also store in the global cache manager for better persistence
        if (cacheManager && !response.config.params?.skipPersistentCache) {
          cacheManager.set(cacheKey, response.data);
        }
      }
      
      // Clear pending request
      const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
      pendingRequests.delete(requestKey);
      
      // Remove overly verbose response info from logs
      const logResponse: Partial<CachedAxiosResponse> = {...response};
      // Safe deletion by checking properties first
      if ('request' in logResponse) {
        delete logResponse.request;
      }
      if ('config' in logResponse) {
        delete logResponse.config;
      }
      
      logger.debug(`API Response (${response.status}): ${response.config.url}`, 
        response.data ? { dataLength: JSON.stringify(response.data).length } : undefined);
      
      return response;
    },
    (error) => {
      // Track request completion to maintain connection limits
      activeRequests = Math.max(0, activeRequests - 1);
      executeQueuedRequests();
      
      // Log detailed error info
      logger.error('API Response Error:', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        logger.warn('Received 401 Unauthorized - Token may be expired or invalid');
        
        // Optional redirect to login page
        // window.location.href = '/signIn';
      }
      
      // Handle server errors with exponential backoff
      const extendedConfig = error.config as ExtendedAxiosRequestConfig;
      if (error.response && error.response.status >= 500 && extendedConfig && !extendedConfig.__retryCount) {
        extendedConfig.__retryCount = 1;
        const retryDelay = 1000 * Math.pow(2, extendedConfig.__retryCount - 1);
        
        logger.warn(`Retrying request to ${extendedConfig.url} after ${retryDelay}ms`);
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(client(extendedConfig));
          }, retryDelay);
        });
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

export const forceRefresh = (url: string, params = {}) => {
  return apiClient.get(url, { 
    params: { 
      ...params,
      forceRefresh: true,
      _t: Date.now() // Add timestamp to prevent browser caching
    } 
  });
};

export const clearCache = (url?: string, params = {}) => {
  if (url) {
    const cacheKey = `${url}${JSON.stringify(params || {})}`;
    delete apiCache[cacheKey];
    
    // Also clear from persistent cache
    cacheManager.delete(cacheKey);
  } else {
    Object.keys(apiCache).forEach(key => {
      delete apiCache[key];
    });
    
    // Also clear persistent cache
    cacheManager.clearAll();
  }
};

export const graphqlClient = {
  query: async <T = any>(
    query: string, 
    variables?: Record<string, any>, 
    options?: Partial<AxiosRequestConfig>
  ): Promise<T> => {
    try {
      const response = await apiClient.post('/graphql', {
        query,
        variables
      }, {
        ...options,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.errors?.length) {
        throw new Error(
          `GraphQL Error: ${response.data.errors.map((e: any) => e.message).join(', ')}`
        );
      }
      
      return response.data.data as T;
    } catch (error) {
      logger.error('GraphQL Error:', error);
      throw error;
    }
  }
};

export default apiClient; 