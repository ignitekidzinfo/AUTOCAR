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

// Get time until token expires (no longer used)
export const getTimeUntilExpiration = (): number | null => null;

// No-op for setupTokenExpirationListener
export const setupTokenExpirationListener = () => () => {}; 