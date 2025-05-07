/**
 * Secure Storage Utility
 * 
 * This file provides a more secure alternative to direct localStorage that encrypts
 * sensitive data before storing it.
 * 
 * Now using localStorage to ensure tokens persist when the tab/browser is closed.
 */

import CryptoJS from 'crypto-js';
import { isDevelopment } from './environment';
import logger from './logger';

// A secret key for encryption (in production, this should be loaded from environment variables)
const SECRET_KEY = process.env.REACT_APP_STORAGE_KEY || 'car-auto-care-secret-key';

// Retry mechanism constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // milliseconds

/**
 * SecureStorage class that encrypts data before storing it in localStorage
 */
class SecureStorage {
  /**
   * Get an item from secure storage
   * @param key - The key to retrieve
   * @returns The decrypted value or null if not found
   */
  getItem(key: string): any {
    // First try to get from localStorage directly
    try {
      const encryptedData = localStorage.getItem(key);
      
      if (!encryptedData) {
        // Also check for unencrypted fallback in development
        if (isDevelopment) {
          const fallbackKey = `unencrypted_${key}`;
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            try {
              return JSON.parse(fallbackData);
            } catch {
              return fallbackData;
            }
          }
        }
        return null;
      }
      
      // Try to decrypt with error handling
      try {
        // Decrypt the data
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedData) {
          // If we can't decrypt but there's encrypted data, use failsafe
          logger.warn(`Decryption produced empty result for key: ${key}`);
          
          // In development mode, check if we have an unencrypted fallback
          if (isDevelopment) {
            const fallbackKey = `unencrypted_${key}`;
            const fallbackData = localStorage.getItem(fallbackKey);
            if (fallbackData) {
              try {
                return JSON.parse(fallbackData);
              } catch {
                return fallbackData;
              }
            }
          }
          
          return null;
        }
        
        // Parse the JSON data
        return JSON.parse(decryptedData);
      } catch (decryptError) {
        logger.error(`Decryption error for key ${key}:`, decryptError);
        
        // If decryption fails, check if we have an unencrypted fallback
        if (isDevelopment) {
          const fallbackKey = `unencrypted_${key}`;
          const fallbackData = localStorage.getItem(fallbackKey);
          if (fallbackData) {
            try {
              return JSON.parse(fallbackData);
            } catch {
              return fallbackData;
            }
          }
        }
        
        return null;
      }
    } catch (error) {
      logger.error(`Error retrieving item from secure storage: ${key}`, error);
      return null;
    }
  }
  
  /**
   * Set an item in secure storage with retries
   * @param key - The key to store
   * @param value - The value to encrypt and store
   */
  async setItem(key: string, value: any): Promise<void> {
    // Implementation with retry mechanism
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Convert value to JSON string
        const valueStr = JSON.stringify(value);
        
        // Encrypt the data
        const encryptedData = CryptoJS.AES.encrypt(valueStr, SECRET_KEY).toString();
        
        // Store in localStorage
        localStorage.setItem(key, encryptedData);
        
        // In development, also store unencrypted as a fallback
        if (isDevelopment) {
          localStorage.setItem(`unencrypted_${key}`, valueStr);
        }
        
        // Verify storage was successful by reading back
        const storedData = localStorage.getItem(key);
        if (!storedData) {
          throw new Error('Verification failed: Data not stored');
        }
        
        // Successfully stored
        return;
      } catch (error) {
        logger.error(`Error setting item in secure storage (attempt ${attempt + 1}): ${key}`, error);
        
        if (attempt < MAX_RETRIES - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          // Last attempt, try unencrypted fallback
          try {
            localStorage.setItem(key, JSON.stringify(value));
            logger.warn(`Stored ${key} unencrypted as last resort`);
          } catch (e) {
            logger.error('All storage attempts failed', e);
          }
        }
      }
    }
  }
  
  /**
   * Remove an item from secure storage
   * @param key - The key to remove
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      // Also remove fallback if in development
      if (isDevelopment) {
        localStorage.removeItem(`unencrypted_${key}`);
      }
    } catch (error) {
      logger.error(`Error removing item from secure storage: ${key}`, error);
    }
  }
  
  /**
   * Clear all items from secure storage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Error clearing secure storage', error);
    }
  }
  
  /**
   * Get the names of all keys in secure storage
   * @returns Array of key names
   */
  keys(): string[] {
    try {
      return Object.keys(localStorage).filter(key => !key.startsWith('unencrypted_'));
    } catch (error) {
      logger.error('Error getting keys from secure storage', error);
      return [];
    }
  }
}

// Export a singleton instance
export const secureStorage = new SecureStorage();
export default secureStorage; 