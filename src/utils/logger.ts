import { isProduction } from './environment';

// Sensitive keywords to detect in objects being logged
const SENSITIVE_KEYS = [
  'password', 'authorization', 'pin', 'credential',
  'ssn', 'social', 'creditCard', 'credit', 'cvv', 'cvc'
];

// Authentication-related keywords (these will be allowed through but sanitized)
const AUTH_RELATED_KEYS = [
  'token', 'auth', 'authentication', 'login', 'secret', 'key', 'apiKey'
];

// Global configuration object - can be modified to toggle logging
export const logConfig = {
  enabled: true, // enabled by default to allow authentication logs
  authLogsEnabled: true // specifically enable auth logs
};

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
    
    // Check if this is an auth-related key (which should be sanitized but allowed)
    const isAuthKey = AUTH_RELATED_KEYS.some(pattern => 
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
    } else if (isAuthKey && typeof sanitized[key] === 'string' && sanitized[key].length > 20) {
      // For auth keys with long string values, only show first few and last few chars
      sanitized[key] = sanitized[key].substring(0, 5) + '...' + 
        sanitized[key].substring(sanitized[key].length - 5);
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
  // Enable or disable logging
  enable: () => {
    logConfig.enabled = true;
  },
  
  disable: () => {
    logConfig.enabled = false;
  },
  
  enableAuthLogs: () => {
    logConfig.authLogsEnabled = true;
  },
  
  disableAuthLogs: () => {
    logConfig.authLogsEnabled = false;
  },
  
  log: (...args: any[]) => {
    if (!logConfig.enabled && !logConfig.authLogsEnabled) return;
    console.log(...args.map(arg => sanitizeData(arg)));
  },
  
  info: (...args: any[]) => {
    if (!logConfig.enabled && !logConfig.authLogsEnabled) return;
    console.info(...args.map(arg => sanitizeData(arg)));
  },
  
  warn: (...args: any[]) => {
    // We keep warnings in production, but sanitize them
    if (!logConfig.enabled && !logConfig.authLogsEnabled) return;
    console.warn(...args.map(arg => sanitizeData(arg)));
  },
  
  error: (...args: any[]) => {
    // We always keep errors, but sanitize them
    console.error(...args.map(arg => sanitizeData(arg)));
  },
  
  debug: (...args: any[]) => {
    if (!logConfig.enabled && !logConfig.authLogsEnabled) return;
    console.debug(...args.map(arg => sanitizeData(arg)));
  },
  
  // Special method for data that should never be logged in production
  sensitive: (...args: any[]) => {
    if (isProduction) return;
    if (!logConfig.enabled && !logConfig.authLogsEnabled) return;
    console.log(...args.map(arg => sanitizeData(arg)));
  }
};

// Enable auth logs on import
logger.enableAuthLogs();

export default logger; 