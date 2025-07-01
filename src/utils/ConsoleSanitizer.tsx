import { useEffect } from 'react';
import { isProduction } from './environment';
import logger from './logger';

/**
 * This component overrides the default console methods
 * to prevent console logs from appearing in the browser console.
 * It can be enabled in both development and production environments.
 */
const ConsoleSanitizer = () => {
  useEffect(() => {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Override console methods to disable or sanitize logs
    console.log = (...args: any[]) => {
      // Completely disable standard logs
      // For critical logs, use logger.log instead
    };

    console.info = (...args: any[]) => {
      // Completely disable info logs
      // For critical info, use logger.info instead
    };

    console.warn = (...args: any[]) => {
      // Use our sanitized logger for warnings
      // Only in production mode - useful for debugging
      if (isProduction) {
        logger.warn(...args);
      }
    };

    console.error = (...args: any[]) => {
      // Keep error logs as they are important for debugging
      // but sanitize them
      logger.error(...args);
    };

    console.debug = (...args: any[]) => {
      // Completely disable debug logs
    };

    // Restore original methods when component unmounts
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ConsoleSanitizer; 