import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import NavigationMenu from './components/navigation/NavigationMenu';
import ConsoleSanitizer from './utils/ConsoleSanitizer';
import logger from './utils/logger';
import TermsAndConditionsList from './components/Terms/TermsAndConditionsList';
import AddTermsAndConditions from './components/Terms/AddTermsAndConditions';
import SignInSide from './pages/SignInSide';
import SessionExpirationHandler from './components/navigation/SessionExpirationHandler';
import ErrorBoundary from './components/common/ErrorBoundary';
import TokenExpiryNotification from './components/common/TokenExpiryNotification';
import TokenValidityChecker from './components/common/TokenValidityChecker';
import { initDevToolsProtection } from './utils/devToolsProtection';
import { 
  getUserFromToken, 
  logout,
  User,
  forceCheckTokenValidity,
  isTokenValid
} from './utils/tokenUtils';

import { useAuth } from './context/AuthContext';
import AppRoutes from './AppRoutes';

// Initialize DevTools protection with appropriate settings
// This will help protect sensitive data in the browser
initDevToolsProtection({
  action: 'warn',
  warningMessage: 'Developer tools usage is being logged for security purposes.',
  useDebuggerTrap: false, // Disable debugger trap as it can be disruptive
});

const Header: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <Box sx={{ 
      bgcolor: '#2c3e50', 
      color: 'white', 
      p: 2, 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Box 
        component={Link} 
        to="/" 
        sx={{ textDecoration: 'none', color: 'white' }}
      >
        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>AutoCarCarePoint</Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box 
          component={Link} 
          to="/" 
          sx={{ color: 'white', textDecoration: 'none' }}
        >
          Home
        </Box>
        <Box 
          component={Link} 
          to="/buy-accessories" 
          sx={{ color: 'white', textDecoration: 'none' }}
        >
          Buy Accessories
        </Box>
        
        {user.isAuthenticated && (user.role === 'ADMIN' || user.role === 'EMPLOYEE') && (
          <Box 
            component={Link} 
            to="/dashboard" 
            sx={{ color: 'white', textDecoration: 'none' }}
          >
            Dashboard
          </Box>
        )}
        
        {user.isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>{user.name} ({user.role})</Box>
            <Box 
              component="button" 
              onClick={onLogout} 
              sx={{ 
                bgcolor: 'transparent',
                border: '1px solid white',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                cursor: 'pointer'
              }}
            >
              Logout
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// AuthGuard component to protect routes
const AuthGuard: React.FC<{
  user: User;
  requiredRoles?: string[];
  children: React.ReactNode;
}> = ({ user, requiredRoles = [], children }) => {
  // Don't perform automatic token validation on component mount
  // This prevents logout loops when navigating between authenticated routes
  
  if (!user.isAuthenticated) {
    return <Navigate to="/signIn" />;
  }

  // Admin users can access all routes
  if (user.role === 'ADMIN') {
    return <TokenValidityChecker>{children}</TokenValidityChecker>;
  }

  // For non-admin users, check role-based permissions
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Box p={4}>You don't have permission to access this page.</Box>;
  }

  return <TokenValidityChecker>{children}</TokenValidityChecker>;
};

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  if (!user.isAuthenticated || (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE')) {
    return <Box>Not authorized</Box>;
  }

  return (
    <TokenValidityChecker>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <NavigationMenu components={user.components} userRole={user.role} />
      </Box>
    </TokenValidityChecker>
  );
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <ConsoleSanitizer />
      {isAuthenticated && <SessionExpirationHandler />}
      <TokenExpiryNotification />
      <AppRoutes />
    </ErrorBoundary>
  );
};

export default App;