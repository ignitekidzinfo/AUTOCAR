import { useEffect } from 'react';
import { isProduction } from './environment';
import logger from './logger';

/**
 * This component overrides the default console methods with sanitized versions
 * when the app is in production mode to prevent sensitive information leakage.
 * 
 * Currently configured to allow all console output for debugging purposes.
 */
const ConsoleSanitizer = () => {
  useEffect(() => {
    // Console sanitization is now enabled
    
    if (isProduction) {
      // Store original console methods
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      };

      // Override console methods in production
      console.log = (...args: any[]) => {
        // Completely disable standard logs in production
        // For critical logs, use logger.log instead
      };

      console.info = (...args: any[]) => {
        // Completely disable info logs in production
        // For critical info, use logger.info instead
      };

      console.warn = (...args: any[]) => {
        // Use our sanitized logger for warnings
        logger.warn(...args);
      };

      console.error = (...args: any[]) => {
        // Use our sanitized logger for errors
        logger.error(...args);
      };

      console.debug = (...args: any[]) => {
        // Completely disable debug logs in production
      };

      // Restore original methods when component unmounts
      return () => {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.debug = originalConsole.debug;
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default ConsoleSanitizer; 