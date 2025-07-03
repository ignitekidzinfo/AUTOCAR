/**
 * Environment detection utility
 */

// Check if the environment is production
export const isProduction = process.env.NODE_ENV === 'production';

// Check if the environment is development
export const isDevelopment = process.env.NODE_ENV === 'development';

// Check if the environment is test
export const isTest = process.env.NODE_ENV === 'test';

// Utility to get current environment name
export const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};

// API URL depending on environment
export const getApiBaseUrl = (): string => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
}; 