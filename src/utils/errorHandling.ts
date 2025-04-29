/**
 * Error Handling Utilities
 * 
 * This file provides standardized error handling utilities to ensure consistent
 * error handling across the application.
 */
import { AxiosError } from 'axios';
import logger from './logger';
import { toast } from 'react-toastify';

// Error types
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  NOT_FOUND = 'not_found',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Standard error structure
export interface StandardError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
  originalError?: any;
}

/**
 * Format API error into standard format
 * @param error - The error to format
 * @returns Standardized error object
 */
export const formatApiError = (error: any): StandardError => {
  // Handle axios errors
  if (error.isAxiosError) {
    const axiosError = error as AxiosError;
    
    // Network errors
    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network error. Please check your connection and try again.',
        originalError: error
      };
    }
    
    // Handle different status codes
    switch (axiosError.response.status) {
      case 400:
        return {
          type: ErrorType.VALIDATION,
          message: 'The request was invalid. Please check your input and try again.',
          code: 400,
          details: axiosError.response.data,
          originalError: error
        };
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          message: 'You are not authenticated. Please log in and try again.',
          code: 401,
          originalError: error
        };
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: 'You do not have permission to perform this action.',
          code: 403,
          originalError: error
        };
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: 'The requested resource was not found.',
          code: 404,
          originalError: error
        };
      case 408:
        return {
          type: ErrorType.TIMEOUT,
          message: 'The request timed out. Please try again later.',
          code: 408,
          originalError: error
        };
      case 500:
      case 501:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER,
          message: 'A server error occurred. Please try again later.',
          code: axiosError.response.status,
          details: axiosError.response.data,
          originalError: error
        };
      default:
        return {
          type: ErrorType.UNKNOWN,
          message: 'An unknown error occurred. Please try again later.',
          code: axiosError.response.status,
          details: axiosError.response.data,
          originalError: error
        };
    }
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      type: ErrorType.VALIDATION,
      message: error.message || 'Validation error. Please check your input and try again.',
      details: error.errors,
      originalError: error
    };
  }
  
  // Handle other errors
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'An unknown error occurred.',
    originalError: error
  };
};

/**
 * Handle error with logging and notification
 * @param error - The error to handle
 * @param options - Additional options for error handling
 * @returns Standardized error object
 */
export const handleError = (
  error: any, 
  options: { 
    notify?: boolean; 
    logLevel?: 'error' | 'warn' | 'info';
    context?: string;
  } = {}
): StandardError => {
  // Set default options
  const { 
    notify = true, 
    logLevel = 'error',
    context = ''
  } = options;
  
  // Format the error
  const formattedError = formatApiError(error);
  
  // Log the error
  const contextPrefix = context ? `[${context}] ` : '';
  const logMessage = `${contextPrefix}${formattedError.message}`;
  
  switch (logLevel) {
    case 'warn':
      logger.warn(logMessage, formattedError);
      break;
    case 'info':
      logger.info(logMessage, formattedError);
      break;
    case 'error':
    default:
      logger.error(logMessage, formattedError);
      break;
  }
  
  // Show notification if requested
  if (notify) {
    const toastType = formattedError.type === ErrorType.VALIDATION ? 'warning' : 'error';
    toast[toastType](formattedError.message);
  }
  
  return formattedError;
};

/**
 * Try to extract a user-friendly error message from the error
 * @param error - The error to extract message from
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  // Format the error if it's not already formatted
  const formattedError = error.type 
    ? error as StandardError 
    : formatApiError(error);
  
  // Return the message
  return formattedError.message;
};

/**
 * Try-catch wrapper for async functions with standardized error handling
 * @param fn - The async function to execute
 * @param options - Additional options for error handling
 * @returns A function that will catch and handle errors
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    notify?: boolean;
    logLevel?: 'error' | 'warn' | 'info';
    context?: string;
  } = {}
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error;
    }
  };
}; 