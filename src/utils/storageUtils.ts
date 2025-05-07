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
    
    // Clear cached values
    cachedToken = null;
    cachedUserData = null;
    
    // Reset the unauthorized401Count to prevent old 401s from carrying over
    sessionStorage.setItem('unauthorized401Count', '0');
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