# Console Cleanup Guide

This application has been configured to suppress console logs to keep the browser console clean.

## How Console Logging is Handled

1. By default, all console logs are suppressed through the `ConsoleSanitizer` component integrated in App.tsx
2. The `logConfig.enabled` flag in logger.ts is set to `false` by default
3. In production builds, all console logs are automatically removed through webpack optimization

## Enabling Logs for Debugging

If you need to enable console logs for debugging:

### Method 1: Temporary Debug Mode

Open the browser console and run:

```js
import('/static/js/main.*.js').then(module => {
  if (module.enableDebugMode) {
    module.enableDebugMode(300000); // Enable for 5 minutes (300000ms)
  }
});
```

### Method 2: Modify the Code

1. Open `src/utils/logger.ts`
2. Change `enabled: false` to `enabled: true`
3. Reload the application

### Method 3: Disable ConsoleSanitizer

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
4. In production, only errors will be shown in the console 