import { useEffect } from 'react';
import { isProduction } from './environment';
import logger from './logger';

// Extend Window interface to include our custom methods
declare global {
  interface Window {
    _enableConsole?: (duration?: number) => void;
    _originalConsole?: Record<string, any>;
    _getOriginalConsole?: () => Record<string, any>;
  }
}

/**
 * This component completely disables all console methods
 * to prevent any logs from appearing in the browser console.
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

    // Override ALL console methods with empty function
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop;
    console.trace = noop;
    console.dir = noop;
    console.dirxml = noop;
    console.group = noop;
    console.groupCollapsed = noop;
    console.groupEnd = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
    console.timeStamp = noop;
    console.assert = noop;
    console.clear = noop;
    console.count = noop;
    console.countReset = noop;
    console.table = noop;
    console.profile = noop;
    console.profileEnd = noop;

    // Add a special method to temporarily enable console for debugging
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
          (console as any)[key] = noop;
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
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ConsoleSanitizer; 