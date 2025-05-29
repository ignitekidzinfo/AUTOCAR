/**
 * Cache utility functions for the application
 */

// Cache keys
export const CACHE_KEYS = {
  USER_PARTS: 'userPartsCache',
  USER_PARTS_TIMESTAMP: 'userPartsCacheTimestamp',
  QUOTATIONS: 'quotationsCache',
  QUOTATIONS_TIMESTAMP: 'quotationsCacheTimestamp',
};

// Cache event names
export const CACHE_EVENTS = {
  USER_PARTS_UPDATED: 'userPartsCacheUpdated',
  QUOTATIONS_UPDATED: 'quotationsCacheUpdated',
};

// Default cache expiry time (5 minutes)
export const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Invalidate the user parts cache
 */
export const invalidateUserPartsCache = () => {
  // Update timestamp in localStorage
  localStorage.setItem(CACHE_KEYS.USER_PARTS_TIMESTAMP, Date.now().toString());
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent(CACHE_EVENTS.USER_PARTS_UPDATED));
  
  console.log('User parts cache invalidated at', new Date().toLocaleTimeString());
};

/**
 * Invalidate the quotations cache
 */
export const invalidateQuotationsCache = () => {
  // Update timestamp in localStorage
  localStorage.setItem(CACHE_KEYS.QUOTATIONS_TIMESTAMP, Date.now().toString());
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent(CACHE_EVENTS.QUOTATIONS_UPDATED));
  
  console.log('Quotations cache invalidated at', new Date().toLocaleTimeString());
};

/**
 * Check if a cache is valid
 * @param cacheKey The key of the cache timestamp to check
 * @param expiryTime The cache expiry time in milliseconds
 * @returns boolean indicating if the cache is valid
 */
export const isCacheValid = (cacheKey: string, expiryTime = DEFAULT_CACHE_EXPIRY): boolean => {
  const timestamp = localStorage.getItem(cacheKey);
  if (!timestamp) return false;
  
  const parsedTimestamp = parseInt(timestamp, 10);
  const now = Date.now();
  
  // Cache is valid if less than expiryTime has passed
  return !isNaN(parsedTimestamp) && (now - parsedTimestamp < expiryTime);
};

/**
 * Clear all application caches
 */
export const clearAllCaches = () => {
  localStorage.removeItem(CACHE_KEYS.USER_PARTS);
  localStorage.removeItem(CACHE_KEYS.USER_PARTS_TIMESTAMP);
  localStorage.removeItem(CACHE_KEYS.QUOTATIONS);
  localStorage.removeItem(CACHE_KEYS.QUOTATIONS_TIMESTAMP);
  
  console.log('All caches cleared at', new Date().toLocaleTimeString());
}; 