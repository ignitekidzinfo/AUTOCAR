# Console Cleanup Guide

This application has been configured to completely suppress all console logs to keep the browser console clean.

## How Console Logging is Handled

1. By default, all console logs are suppressed through the `ConsoleSanitizer` component integrated in App.tsx
2. The `ConsoleSanitizer` component replaces all console methods with empty functions
3. In production builds, all console logs are automatically removed through webpack optimization

## Enabling Logs for Debugging

If you need to enable console logs for debugging:

### Method 1: Use the Built-in Debug Helper

Open the browser console and run:

```js
window._enableConsole(300000); // Enable for 5 minutes (300000ms)
```

This will temporarily restore all console methods for the specified duration (default: 1 minute).

### Method 2: Disable ConsoleSanitizer

1. Open `src/App.tsx`
2. Comment out the `<ConsoleSanitizer />` component
3. Reload the application

## Best Practices

1. Never use `console.log` directly in the code
2. Always use the logger utility:
   ```js
   import logger from '../utils/logger';
   
   // Instead of console.log
   logger.log('Some debug info');
   
   // For important warnings
   logger.warn('Warning message');
   
   // For errors
   logger.error('Error details');
   ```

3. Make sure to disable logs before committing code
4. In production, only errors should be shown in the console (if any)

## Troubleshooting

If you still see logs in the console:

1. Make sure the `ConsoleSanitizer` component is properly mounted in App.tsx
2. Check if there are any console logs being called before the ConsoleSanitizer is initialized
3. Some third-party libraries may use their own logging mechanisms - check for those 