/**
 * Storage Utility Functions
 * 
 * This file provides utilities to help with managing authentication data in localStorage
 * via secureStorage wrapper.
 */

import secureStorage from './secureStorage';
import logger from './logger';

// Cached token to avoid repeated storage access
let cachedToken: string | null = null;
let cachedUserData: any = null;

/**
 * Get user data from secureStorage
 */
export const getUserData = (): any => {
  try {
    // Return cached value if available
    if (cachedUserData) {
      return cachedUserData;
    }

    // Get from secureStorage (localStorage with encryption)
    const secureData = secureStorage.getItem('userData');
    if (secureData) {
      // Cache the result
      cachedUserData = secureData;
      return secureData;
    }

    // If no secure data, try direct localStorage as fallback
    try {
      const localData = localStorage.getItem('userData');
      if (localData) {
        const parsedData = JSON.parse(localData);
        cachedUserData = parsedData;
        return parsedData;
      }
    } catch (e) {
      logger.error('Error reading from localStorage fallback:', e);
    }

    return null;
  } catch (e) {
    logger.error('Error in getUserData:', e);
    return null;
  }
};

/**
 * Get auth token from secureStorage
 */
export const getAuthToken = (): string | null => {
  try {
    // Return cached token if available
    if (cachedToken) {
      return cachedToken;
    }

    // Get from secureStorage
    const secureToken = secureStorage.getItem('token');
    if (secureToken) {
      // Cache the token
      cachedToken = secureToken;
      return secureToken;
    }

    // If no secure token, try direct localStorage as fallback
    try {
      const localToken = localStorage.getItem('token');
      if (localToken) {
        cachedToken = localToken;
        return localToken;
      }
    } catch (e) {
      logger.error('Error reading token from localStorage fallback:', e);
    }

    return null;
  } catch (e) {
    logger.error('Error in getAuthToken:', e);
    return null;
  }
};

/**
 * Get generic item from storage
 */
export const getItem = (key: string): string | null => {
  try {
    // Get from secureStorage
    const secureValue = secureStorage.getItem(key);
    if (secureValue) {
      return secureValue;
    }

    // Try direct localStorage as fallback
    try {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        try {
          return JSON.parse(localValue);
        } catch {
          return localValue;
        }
      }
    } catch (e) {
      logger.error(`Error reading ${key} from localStorage fallback:`, e);
    }

    return null;
  } catch (e) {
    logger.error(`Error getting item ${key}:`, e);
    return null;
  }
};

/**
 * Set generic item in storage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    // Store in secureStorage (encrypted localStorage)
    await secureStorage.setItem(key, value);

    // Update cache if setting token or userData
    if (key === 'token') {
      cachedToken = value;
    } else if (key === 'userData') {
      cachedUserData = value;
    }
  } catch (e) {
    logger.error(`Error setting item ${key}:`, e);
  }
};

/**
 * Remove both token and userData from storage
 * to ensure clean logout
 */
export const clearAuthData = () => {
  try {
    // Clear from secureStorage
    secureStorage.removeItem('token');
    secureStorage.removeItem('userData');

    // Also clear from regular localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');

    // Clear cached values
    cachedToken = null;
    cachedUserData = null;

    // Reset the unauthorized401Count to prevent old 401s from carrying over
    sessionStorage.setItem('unauthorized401Count', '0');

    console.log('Auth data cleared successfully');
  } catch (e) {
    logger.error('Error in clearAuthData:', e);
  }
};

export default {
  getUserData,
  getAuthToken,
  clearAuthData,
  getItem,
  setItem
}; 