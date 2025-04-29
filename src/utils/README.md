# Secure Logging System

This directory contains utilities for secure logging in the application. The primary goal is to prevent sensitive information from being exposed in the browser console, especially in production environments.

## Components

1. **logger.ts** - A utility that provides sanitized logging methods that automatically mask sensitive data.
2. **environment.ts** - Utilities for detecting the current runtime environment.
3. **ConsoleSanitizer.tsx** - A React component that overrides default console methods in production.

## Why Secure Logging?

The browser console is accessible to anyone who opens developer tools, which can expose:
- Authentication tokens
- User credentials
- Personal information
- API responses with sensitive data

Many security breaches have occurred because applications accidentally logged sensitive information to the console.

## How to Use

### Preferred Method: Use the logger utility

Instead of using `console.log`, use the provided `logger` utility:

```tsx
import logger from '../utils/logger';

// For regular logs (only show in development)
logger.log('Component loaded');

// For informational logs (only show in development)
logger.info('Processing data:', data);

// For warnings (show in all environments, but sanitized)
logger.warn('Warning: Approaching rate limit');

// For errors (show in all environments, but sanitized)
logger.error('API request failed:', error);

// For sensitive data that should never be logged in production
logger.sensitive('User data:', userData);
```

### Integration in App

The `ConsoleSanitizer` component is included in the App.tsx file, which automatically:
1. Disables `console.log`, `console.info`, and `console.debug` in production
2. Sanitizes `console.warn` and `console.error` in production

## Data Sanitization

The logger automatically detects and masks sensitive data in objects based on key names:
- `password`, `token`, `authorization`, `auth`
- `secret`, `key`, `apiKey`, `pin`, `credential`
- `ssn`, `social`, `creditCard`, `credit`, `cvv`, `cvc`

Example sanitization:
```tsx
// This:
logger.log({
  username: 'john',
  password: 'secret123',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});

// Will be logged as:
{
  username: 'john',
  password: '********',
  token: '********'
}
```

## Best Practices

1. **Never use console.log directly** - Always use the logger utility
2. **Don't log sensitive data** - Even with sanitization, avoid logging sensitive data when possible
3. **Use appropriate log levels** - Use info/log for routine data, warn for potential issues, error for failures
4. **Clean up debugging logs** - Remove unnecessary logs before committing code

## API Client Integration

The API client has been configured to use the secure logger, automatically sanitizing request and response data in logs.

## Network Response Sanitization

The application includes functionality to sanitize network responses before they are visible in the browser's network tab. This is implemented in `apiClient.ts` and serves several purposes:

1. **Security**: Prevents sensitive data from being exposed in the browser's development tools
2. **Compliance**: Helps maintain data privacy by redacting sensitive information
3. **Development**: Makes debugging easier by cleaning up responses

### How it works

Two main network APIs are overridden:

#### XMLHttpRequest Override
- Intercepts `open()` and `send()` methods
- Captures the response before it's visible in the network tab
- Sanitizes JSON responses by redacting sensitive fields

#### Fetch API Override
- Creates a wrapper around the global `fetch()` function
- Clones responses to avoid consuming them
- Provides a modified `json()` method that sanitizes data

### Sensitive Data Handling

The sanitization function automatically redacts the following sensitive fields:
- password
- token
- secret
- creditCard
- ssn

You can modify the list of sensitive fields in the `sanitizeResponseData()` function in `apiClient.ts`.

### Usage

This feature works automatically for all network requests. No additional configuration is needed for basic functionality. 