import { jwtDecode } from 'jwt-decode';
import logger from './logger';
import secureStorage from './secureStorage';
import { toast } from 'react-toastify';

// Token decoder interface
export interface DecodedToken {
  sub: string;
  firstname: string;
  userId: number;
  componentNames: string[];
  authorities: string[];
  roles: string[];
  isEnable: boolean;
  iat: number;
  exp: number;
}

export interface User {
  isAuthenticated: boolean;
  name: string;
  role: string;
  components: string[];
}

// Check if token is valid and not expired
export const isTokenValid = (): boolean => {
  try {
    const token = secureStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Ensure exp exists
      if (!decoded.exp) {
        logger.warn('Token is missing expiration time');
        return false;
      }
      
      const expTime = Number(decoded.exp) * 1000;
      const currentTime = Date.now();
      
      // Add buffer time (30 seconds) to prevent edge cases and ensure early validation
      return expTime > (currentTime + 30000);
    } catch (decodeError) {
      // If token can't be decoded, it's invalid
      logger.error('Failed to decode token:', decodeError);
      return false;
    }
  } catch (error) {
    logger.error('Error validating token:', error);
    return false;
  }
};

// Force check token validity and redirect if expired
export const forceCheckTokenValidity = (): void => {
  // Skip check on login page and signup page
  const currentPath = window.location.pathname;
  if (currentPath === '/signIn' || currentPath === '/signup') {
    return;
  }
  
  if (!isTokenValid()) {
    // Token is expired or invalid, clear auth data
    clearAuthData();
    
    // Save current location for redirect after login
    secureStorage.setItem('redirectAfterLogin', currentPath);
    
    // Show toast notification
    toast.error('Your session has expired. Please sign in again.');
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/signIn';
    }, 1000);
  }
};

// Get the decoded token if valid
export const getDecodedToken = (): DecodedToken | null => {
  try {
    const token = secureStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Ensure exp exists
    if (!decoded.exp) {
      logger.warn('Token is missing expiration time');
      return null;
    }
    
    const expTime = Number(decoded.exp) * 1000;
    const currentTime = Date.now();
    
    if (expTime <= currentTime) {
      logger.warn('Token expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

// Get user details from token
export const getUserFromToken = (): User => {
  const decoded = getDecodedToken();
  
  if (!decoded) {
    return {
      isAuthenticated: false,
      name: '',
      role: '',
      components: []
    };
  }
  
  return {
    isAuthenticated: true,
    name: decoded.firstname || decoded.sub,
    role: decoded.roles?.[0] || 'USER',
    components: decoded.componentNames || []
  };
};

// Clear auth data and redirect to login
export const clearAuthData = (): void => {
  // Clear storage from secureStorage (which is now using localStorage)
  secureStorage.removeItem('token');
  secureStorage.removeItem('userData');
};

// Handle logout by clearing token and session
export const logout = (): void => {
  // Clear auth data
  clearAuthData();
  
  // Redirect to login page
  window.location.href = '/signIn';
};

// Get time until token expires (in milliseconds)
export const getTimeUntilExpiration = (): number | null => {
  try {
    const token = secureStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Ensure exp exists
    if (!decoded.exp) {
      logger.warn('Token is missing expiration time');
      return null;
    }
    
    const expTime = Number(decoded.exp) * 1000;
    const currentTime = Date.now();
    
    return expTime > currentTime ? expTime - currentTime : null;
  } catch (error) {
    logger.error('Error calculating token expiration time:', error);
    return null;
  }
};

// Set up a token expiration listener with auto-logout
export const setupTokenExpirationListener = (
  onExpiringSoon?: () => void,
  warningTime: number = 5 * 60 * 1000 // 5 minutes before expiration
): (() => void) => {
  // Initially check token
  const timeUntilExp = getTimeUntilExpiration();
  
  if (!timeUntilExp) {
    // Token invalid or expired - logout immediately
    logout();
    return () => {}; // Return empty cleanup function
  }
  
  // Set timeout for warning when token is about to expire
  let warningTimeout: number | undefined;
  if (timeUntilExp > warningTime) {
    warningTimeout = window.setTimeout(() => {
      if (onExpiringSoon) {
        onExpiringSoon();
      }
    }, timeUntilExp - warningTime);
  }
  
  // Set timeout for actual logout when token expires
  const logoutTimeout = window.setTimeout(() => {
    logout();
  }, timeUntilExp);
  
  // Return cleanup function to clear timeouts
  return () => {
    if (warningTimeout) {
      window.clearTimeout(warningTimeout);
    }
    window.clearTimeout(logoutTimeout);
  };
}; 