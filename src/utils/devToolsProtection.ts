/**
 * DevTools Protection
 * 
 * This utility adds protection against browser developer tools being used to inspect
 * sensitive data on the application. It uses multiple detection techniques and
 * provides configurable responses when DevTools are detected.
 */

import logger from './logger';
import { isProduction } from './environment';

// Options for detection and response
interface DevToolsProtectionOptions {
  // Action to take when devtools is detected
  action: 'warn' | 'blur' | 'redirect' | 'logout' | 'none';
  // Message to show when warning
  warningMessage?: string;
  // URL to redirect to if action is 'redirect'
  redirectUrl?: string;
  // Custom action function
  customAction?: () => void;
  // Use various detection methods
  useConsoleTrap?: boolean;
  useDebuggerTrap?: boolean;
  useDimensionCheck?: boolean;
  usePerformanceCheck?: boolean;
}

// Default options
const defaultOptions: DevToolsProtectionOptions = {
  action: isProduction ? 'warn' : 'none',
  warningMessage: 'Developer tools detected. This action has been logged.',
  redirectUrl: '/unauthorized',
  useConsoleTrap: true,
  useDebuggerTrap: isProduction,
  useDimensionCheck: true,
  usePerformanceCheck: true
};

// Store detection state
let devToolsDetected = false;
let isInitialized = false;

/**
 * Respond to DevTools detection based on configured action
 */
const respondToDevToolsDetection = (options: DevToolsProtectionOptions) => {
  if (devToolsDetected) return; // Already detected and responded
  
  devToolsDetected = true;
  logger.warn('DevTools detected');
  
  switch (options.action) {
    case 'warn':
      if (options.warningMessage) {
        console.warn(options.warningMessage);
        alert(options.warningMessage);
      }
      break;
      
    case 'blur':
      // Blur content to make it unreadable
      const style = document.createElement('style');
      style.innerHTML = `
        body * {
          filter: blur(10px) !important;
          user-select: none !important;
          pointer-events: none !important;
        }
        body::after {
          content: "Unauthorized DevTools Access Detected";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: red;
          background: rgba(0,0,0,0.7);
          z-index: 999999;
        }
      `;
      document.head.appendChild(style);
      break;
      
    case 'redirect':
      if (options.redirectUrl) {
        window.location.href = options.redirectUrl;
      }
      break;
      
    case 'logout':
      // Redirect to login page
      window.location.href = '/signIn';
      break;
      
    case 'none':
      // Do nothing, just log
      break;
      
    default:
      if (options.customAction) {
        options.customAction();
      }
  }
};

/**
 * Console trap method
 * Detects DevTools by measuring time to execute console commands
 */
const setupConsoleTrap = (options: DevToolsProtectionOptions) => {
  const consoleOpenThreshold = 10; // ms
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  
  // Override console methods to detect when they're being examined
  for (const method of ['log', 'info', 'warn', 'error'] as const) {
    console[method] = function(...args: any[]) {
      const startTime = performance.now();
      originalConsole[method](...args);
      const endTime = performance.now();
      
      // If execution takes longer than the threshold, DevTools might be open with breakpoints
      if (endTime - startTime > consoleOpenThreshold) {
        respondToDevToolsDetection(options);
      }
      
      return;
    };
  }
};

/**
 * Debugger statement method
 * Inserts periodic debugger statements which are triggered when dev tools are open
 */
const setupDebuggerTrap = (options: DevToolsProtectionOptions) => {
  const checkInterval = 1000; // Check every 1000ms
  
  let lastCheck = Date.now();
  
  setInterval(() => {
    const now = Date.now();
    const diff = now - lastCheck;
    
    // Skip if time difference is unreasonable (user might have changed tabs)
    if (diff < 0 || diff > checkInterval * 2) {
      lastCheck = now;
      return;
    }
    
    // Execute debugger statement to check if dev tools are open
    const before = Date.now();
    function debuggerCheck() { debugger; }
    debuggerCheck();
    const after = Date.now();
    lastCheck = after;
    
    // If debugger statement took significant time, DevTools are likely open
    if (after - before > 100) {
      respondToDevToolsDetection(options);
    }
  }, checkInterval);
};

/**
 * Dimension check method
 * Detects DevTools by checking window dimensions
 */
const setupDimensionCheck = (options: DevToolsProtectionOptions) => {
  const threshold = 160; // Minimum size for dev tools
  
  function checkWindowSize() {
    // Calculate the difference between window outer and inner dimensions
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // Check if dimensions suggest DevTools is open
    // DevTools takes significant space at bottom or right side
    if (widthDiff > threshold || heightDiff > threshold) {
      respondToDevToolsDetection(options);
    }
  }
  
  // Check on resize events
  window.addEventListener('resize', checkWindowSize);
  
  // Check periodically
  setInterval(checkWindowSize, 1000);
  
  // Initial check
  checkWindowSize();
};

/**
 * Performance check method
 * Detects DevTools by measuring function call timing differences
 */
const setupPerformanceCheck = (options: DevToolsProtectionOptions) => {
  const samples = 10;
  const checkInterval = 2000;
  
  setInterval(() => {
    let sum = 0;
    let normalizedDeviation = 0;
    
    // Run multiple samples to reduce false positives
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      
      // Run an empty function multiple times
      for (let j = 0; j < 100; j++) {
        (function(){})();
      }
      
      const end = performance.now();
      sum += (end - start);
    }
    
    // Average execution time
    const avg = sum / samples;
    
    // If average execution time is too high, it suggests DevTools is slowing things down
    if (avg > 5) { // 5ms is a conservative threshold
      respondToDevToolsDetection(options);
    }
  }, checkInterval);
};

/**
 * Initialize DevTools protection with options
 */
export const initDevToolsProtection = (userOptions: Partial<DevToolsProtectionOptions> = {}) => {
  if (isInitialized) return;
  
  // Merge default options with user provided options
  const options: DevToolsProtectionOptions = { ...defaultOptions, ...userOptions };
  
  // Skip in development mode unless explicitly enabled
  if (!isProduction && options.action === 'none') {
    logger.debug('DevTools protection disabled in development mode');
    return;
  }
  
  // Set up detection methods
  if (options.useConsoleTrap) {
    setupConsoleTrap(options);
  }
  
  if (options.useDebuggerTrap) {
    setupDebuggerTrap(options);
  }
  
  if (options.useDimensionCheck) {
    setupDimensionCheck(options);
  }
  
  if (options.usePerformanceCheck) {
    setupPerformanceCheck(options);
  }
  
  isInitialized = true;
  logger.debug('DevTools protection initialized');
};

export default {
  initDevToolsProtection
}; 