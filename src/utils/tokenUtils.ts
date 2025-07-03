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
    const isValid = !!token;
    
    // Enhanced logging for token validation
    console.log('Token validation check:', { 
      isValid, 
      tokenExists: !!token 
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// No-op for forceCheckTokenValidity (no longer logs out on expiry)
export const forceCheckTokenValidity = (): void => {
  // No-op: do not force logout on expiry
  console.log('Authentication: Token validity check bypassed');
};
      
// Get the decoded token if present (do not check expiration)
export const getDecodedToken = (): DecodedToken | null => {
  try {
    const token = secureStorage.getItem('token');
    if (!token) {
      console.log('Authentication: No token found for decoding');
      return null;
    }
    
    const decoded = jwtDecode<DecodedToken>(token);
    console.log('Token successfully decoded:', { 
      user: decoded.firstname, 
      roles: decoded.roles,
      componentsCount: decoded.componentNames?.length || 0 
    });
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get user details from token
export const getUserFromToken = (): User => {
  const decoded = getDecodedToken();
  
  if (!decoded) {
    console.log('Authentication: No valid decoded token - returning unauthenticated user');
    return {
      isAuthenticated: false,
      name: '',
      role: '',
      components: []
    };
  }
  
  const user = {
    isAuthenticated: true,
    name: decoded.firstname || decoded.sub,
    role: decoded.roles?.[0] || 'USER',
    components: decoded.componentNames || []
  };
  
  console.log('Authentication: User extracted from token:', { 
    name: user.name, 
    role: user.role, 
    componentsCount: user.components.length 
  });
  
  return user;
};

// Clear auth data and redirect to login
export const clearAuthData = (): void => {
  // Clear storage from secureStorage (which is now using localStorage)
  secureStorage.removeItem('token');
  secureStorage.removeItem('userData');
  console.log('Authentication: Auth data cleared from storage');
};

// Handle logout by clearing token and session
export const logout = (): void => {
  // Clear auth data
  clearAuthData();
  
  // Log the logout action
  console.log('Authentication: User logged out, redirecting to login page');
  
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
    
    if (timeRemaining <= 5 * 60 * 1000) { // 5 minutes or less
      console.log('Authentication: Token expiring soon', { 
        timeRemainingMinutes: Math.round(timeRemaining / 60000) 
      });
    }
    
    return timeRemaining > 0 ? timeRemaining : 0;
  } catch (error) {
    console.error('Error calculating time until expiration:', error);
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
    
    console.log('Authentication: Attempting token refresh', { force });
    
    // Call refresh token endpoint
    const response = await apiClient.post('/api/auth/refresh-token');
    
    if (response.data && response.data.token) {
      // Store new token
      secureStorage.setItem('token', response.data.token);
      console.log('Authentication: Token refresh successful');
      return true;
    }
    
    console.log('Authentication: Token refresh failed - no token in response');
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// No-op for setupTokenExpirationListener
export const setupTokenExpirationListener = () => {
  console.log('Authentication: Token expiration listener setup bypassed');
  return () => {};
}; 