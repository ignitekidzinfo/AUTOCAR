import { jwtDecode } from 'jwt-decode';
import logger from './logger';
import secureStorage from './secureStorage';
import { toast } from 'react-toastify';
import apiClient from '../Services/apiService';

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

// Check if token is valid (do not check expiration)
export const isTokenValid = (): boolean => {
  try {
    const token = secureStorage.getItem('token');
    return !!token;
  } catch (error) {
    logger.error('Error validating token:', error);
    return false;
  }
};

// No-op for forceCheckTokenValidity (no longer logs out on expiry)
export const forceCheckTokenValidity = (): void => {
  // No-op: do not force logout on expiry
};
      
// Get the decoded token if present (do not check expiration)
export const getDecodedToken = (): DecodedToken | null => {
  try {
    const token = secureStorage.getItem('token');
    if (!token) return null;
    return jwtDecode<DecodedToken>(token);
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

// Get time until token expires in milliseconds
export const getTimeUntilExpiration = (): number | null => {
  try {
    const decoded = getDecodedToken();
    if (!decoded || !decoded.exp) return null;
    
    // exp is in seconds, convert to milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    const timeRemaining = expirationTime - currentTime;
    return timeRemaining > 0 ? timeRemaining : 0;
  } catch (error) {
    logger.error('Error calculating time until expiration:', error);
    return null;
  }
};

// Refresh token if needed or if forced
export const refreshTokenIfNeeded = async (force = false): Promise<boolean> => {
  try {
    // Check if token needs refresh (5 min threshold or force)
    const timeRemaining = getTimeUntilExpiration();
    const needsRefresh = force || (timeRemaining !== null && timeRemaining < 5 * 60 * 1000);
    
    if (!needsRefresh) {
      return true; // Token is still valid for a while
    }
    
    // Call refresh token endpoint
    const response = await apiClient.post('/api/auth/refresh-token');
    
    if (response.data && response.data.token) {
      // Store new token
      secureStorage.setItem('token', response.data.token);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error refreshing token:', error);
    return false;
  }
};

// No-op for setupTokenExpirationListener
export const setupTokenExpirationListener = () => () => {}; 