import { useEffect } from 'react';
import logger from './logger';

// Extend Window interface to include our custom methods
declare global {
  interface Window {
    _enableConsole?: (duration?: number) => void;
    _originalConsole?: Record<string, any>;
    _getOriginalConsole?: () => Record<string, any>;
    _authLogsEnabled?: boolean;
  }
}

// List of keywords that should bypass sanitization when in messages
const AUTH_KEYWORDS = [
  'auth',
  'token',
  'login',
  'authentication',
  'isAuthenticated',
  'AuthContext',
  'user.isAuthenticated',
  'Auth state',
  'User authenticated'
];

/**
 * This component selectively disables console methods
 * but preserves authentication-related logs to help with debugging auth issues.
 */
const ConsoleSanitizer = () => {
  useEffect(() => {
    // Get original console methods - either from early HTML script or current console
    const getOriginalMethods = () => {
      if (window._getOriginalConsole) {
        return window._getOriginalConsole();
      }
      
      return {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        trace: console.trace,
        dir: console.dir,
        dirxml: console.dirxml,
        group: console.group,
        groupCollapsed: console.groupCollapsed,
        groupEnd: console.groupEnd,
        time: console.time,
        timeEnd: console.timeEnd,
        timeLog: console.timeLog,
        timeStamp: console.timeStamp,
        assert: console.assert,
        clear: console.clear,
        count: console.count,
        countReset: console.countReset,
        table: console.table,
        profile: console.profile,
        profileEnd: console.profileEnd
      };
    };
    
    // Store original console methods for potential restoration
    const originalConsole: Record<string, any> = getOriginalMethods();

    // Create empty function to replace all console methods
    const noop = () => {};
    
    // Enable auth logs by default
    window._authLogsEnabled = true;
    
    // Create filtered console methods that allow auth-related logs
    const createFilteredMethod = (method: keyof Console) => {
      return (...args: any[]) => {
        // Always let through errors
        if (method === 'error') {
          return originalConsole[method](...args);
        }
        
        // Check if any argument contains auth keywords
        const isAuthLog = args.some(arg => {
          if (typeof arg === 'string') {
            return AUTH_KEYWORDS.some(keyword => 
              arg.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          return false;
        });
        
        if (isAuthLog || window._authLogsEnabled) {
          return originalConsole[method](...args);
        }
        
        // Otherwise, suppress the log
        return undefined;
      };
    };

    // Override console methods with filtered versions
    console.log = createFilteredMethod('log');
    console.info = createFilteredMethod('info');
    console.warn = createFilteredMethod('warn');
    console.error = originalConsole.error; // Always keep errors
    console.debug = createFilteredMethod('debug');
    console.trace = createFilteredMethod('trace');
    console.dir = createFilteredMethod('dir');
    console.dirxml = createFilteredMethod('dirxml');
    console.group = createFilteredMethod('group');
    console.groupCollapsed = createFilteredMethod('groupCollapsed');
    console.groupEnd = createFilteredMethod('groupEnd');
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
    console.timeStamp = noop;
    console.assert = originalConsole.assert;
    console.clear = originalConsole.clear;
    console.count = noop;
    console.countReset = noop;
    console.table = createFilteredMethod('table');
    console.profile = noop;
    console.profileEnd = noop;

    // Add a special method to temporarily enable ALL console for debugging
    window._enableConsole = (duration = 60000) => {
      // Restore original methods
      Object.keys(originalConsole).forEach(key => {
        if (originalConsole[key]) {
          (console as any)[key] = originalConsole[key];
        }
      });
      
      // Use original log method to show message
      if (originalConsole.log) {
        originalConsole.log('Console enabled for', duration / 1000, 'seconds');
      }
      
      // Disable again after duration
      setTimeout(() => {
        Object.keys(originalConsole).forEach(key => {
          const method = key as keyof Console;
          if (method === 'error') {
            (console as any)[method] = originalConsole[method];
          } else if (['assert', 'clear'].includes(method)) {
            (console as any)[method] = originalConsole[method];
          } else if (['log', 'info', 'warn', 'debug', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'table'].includes(method)) {
            (console as any)[method] = createFilteredMethod(method as keyof Console);
          } else {
            (console as any)[method] = noop;
          }
        });
      }, duration);
    };

    // Restore original methods when component unmounts
    return () => {
      Object.keys(originalConsole).forEach(key => {
        if (originalConsole[key]) {
          (console as any)[key] = originalConsole[key];
        }
      });
      // Make the property optional before deletion
      window._enableConsole = undefined;
      window._authLogsEnabled = undefined;
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ConsoleSanitizer; 