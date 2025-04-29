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
    try {
      const encryptedData = localStorage.getItem(key);
      
      if (!encryptedData) {
        return null;
      }
      
      // Decrypt the data
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        return null;
      }
      
      return JSON.parse(decryptedData);
    } catch (error) {
      logger.error(`Error retrieving item from secure storage: ${key}`, error);
      
      // In development, fall back to regular localStorage to avoid blocking development
      if (isDevelopment) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }
  
  /**
   * Set an item in secure storage
   * @param key - The key to store
   * @param value - The value to encrypt and store
   */
  setItem(key: string, value: any): void {
    try {
      // Convert value to JSON string
      const valueStr = JSON.stringify(value);
      
      // Encrypt the data
      const encryptedData = CryptoJS.AES.encrypt(valueStr, SECRET_KEY).toString();
      
      // Store in localStorage
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      logger.error(`Error setting item in secure storage: ${key}`, error);
      
      // In development, fall back to regular localStorage to avoid blocking development
      if (isDevelopment) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          logger.error('Fallback localStorage save failed', e);
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
      return Object.keys(localStorage);
    } catch (error) {
      logger.error('Error getting keys from secure storage', error);
      return [];
    }
  }
}

// Export a singleton instance
export const secureStorage = new SecureStorage();
export default secureStorage; 