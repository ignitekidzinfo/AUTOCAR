import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import storageUtils from '../utils/storageUtils';
import secureStorage from '../utils/secureStorage';
import logger from '../utils/logger';

interface DecodedToken {
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

interface AuthContextType {
  isAuthenticated: boolean;
  authorizedComponents: string[];
  userRole: string;
  userName: string;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authorizedComponents: [],
  userRole: '',
  userName: '',
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authorizedComponents, setAuthorizedComponents] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');

  // Check for token on mount and whenever localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = storageUtils.getAuthToken();
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          
          // Check if token is expired
          const expTime = decoded.exp ? Number(decoded.exp) * 1000 : 0;
          const currentTime = Date.now();
          
          if (expTime <= currentTime) {
            console.log('Token expired, logging out');
            storageUtils.clearAuthData();
            setIsAuthenticated(false);
            return;
          }
          
          setIsAuthenticated(true);
          setAuthorizedComponents(decoded.componentNames || []);
          
          // Get role from either roles or authorities array
          const role = decoded.roles?.[0] || decoded.authorities?.[0] || '';
          setUserRole(role);
          setUserName(decoded.firstname || '');
          
          // Enhanced logging for authentication state
          console.log('Auth state loaded from token:', {
            isAuthenticated: true,
            role: role,
            user: decoded.firstname,
            components: decoded.componentNames?.length || 0,
            authorities: decoded.authorities,
          });
        } catch (error) {
          console.error('Invalid token:', error);
          storageUtils.clearAuthData();
          setIsAuthenticated(false);
          console.log('Authentication failed: Invalid token cleared');
        }
      } else {
        console.log('Authentication: No token found in storage');
        setIsAuthenticated(false);
      }
    };

    // Check auth on mount
    checkAuth();
    
    // Also set up a listener for storage changes (in case another tab logs out)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Store token using secure storage
      storageUtils.clearAuthData(); // Clear any existing data
      secureStorage.setItem('token', token);
      secureStorage.setItem('userData', decoded);
      
      setIsAuthenticated(true);
      setAuthorizedComponents(decoded.componentNames || []);
      
      // Get role from either roles or authorities array
      const role = decoded.roles?.[0] || decoded.authorities?.[0] || '';
      setUserRole(role);
      setUserName(decoded.firstname || '');
      
      // Store raw token in localStorage for debugging (remove in production)
      localStorage.setItem('debug_raw_token', token.substring(0, 20) + '...');
      
      // Enhanced logging for login
      console.log('Login successful - Authentication state updated:', {
        isAuthenticated: true,
        role: role,
        user: decoded.firstname,
        components: decoded.componentNames?.length || 0,
        authorities: decoded.authorities,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    storageUtils.clearAuthData();
    setIsAuthenticated(false);
    setAuthorizedComponents([]);
    setUserRole('');
    setUserName('');
    console.log('User logged out - Authentication state cleared');
    
    // Clear debug values
    localStorage.removeItem('debug_token_stored');
    localStorage.removeItem('debug_login_time');
    localStorage.removeItem('debug_raw_token');
    
    window.location.href = '/signIn';
  };

  const value = {
    isAuthenticated,
    authorizedComponents,
    userRole,
    userName,
    login,
    logout,
  };

  // Detailed authentication state log
  console.log('Current auth state:', {
    isAuthenticated,
    role: userRole,
    user: userName,
    componentsCount: authorizedComponents.length
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 