/**
 * Storage Utility Functions
 * 
 * This file provides utilities to help with managing authentication data in localStorage
 * via secureStorage wrapper.
 */

import secureStorage from './secureStorage';
import logger from './logger';

/**
 * Get user data from secureStorage
 */
export const getUserData = (): any => {
  try {
    // Get from secureStorage (localStorage with encryption)
    const secureData = secureStorage.getItem('userData');
    if (secureData) {
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
    // Get from secureStorage
    const secureToken = secureStorage.getItem('token');
    if (secureToken) {
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
export const setItem = (key: string, value: string): void => {
  try {
    // Store in secureStorage (encrypted localStorage)
    secureStorage.setItem(key, value);
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