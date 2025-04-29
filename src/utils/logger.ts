import { isProduction } from './environment';

// Sensitive keywords to detect in objects being logged
const SENSITIVE_KEYS = [
  'password', 'token', 'authorization', 'auth', 
  'secret', 'key', 'apiKey', 'pin', 'credential',
  'ssn', 'social', 'creditCard', 'credit', 'cvv', 'cvc'
];

/**
 * Recursively sanitizes objects to mask sensitive data
 */
const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  // Handle simple types
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Handle objects
  const sanitized = { ...data };
  for (const key in sanitized) {
    // Check if this is a sensitive key
    const isSensitive = SENSITIVE_KEYS.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isSensitive) {
      // Mask sensitive data with asterisks
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = '********';
      } else if (typeof sanitized[key] === 'number') {
        sanitized[key] = 0;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
};

/**
 * Custom logger implementation that respects environment and sanitizes sensitive data
 */
const logger = {
  log: (...args: any[]) => {
    if (isProduction) return;
    console.log(...args.map(arg => sanitizeData(arg)));
  },
  
  info: (...args: any[]) => {
    if (isProduction) return;
    console.info(...args.map(arg => sanitizeData(arg)));
  },
  
  warn: (...args: any[]) => {
    // We keep warnings in production, but sanitize them
    console.warn(...args.map(arg => sanitizeData(arg)));
  },
  
  error: (...args: any[]) => {
    // We keep errors in production, but sanitize them
    console.error(...args.map(arg => sanitizeData(arg)));
  },
  
  debug: (...args: any[]) => {
    if (isProduction) return;
    console.debug(...args.map(arg => sanitizeData(arg)));
  },
  
  // Special method for data that should never be logged in production
  sensitive: (...args: any[]) => {
    if (isProduction) return;
    console.log(...args.map(arg => sanitizeData(arg)));
  }
};

export default logger; 