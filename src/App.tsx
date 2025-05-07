import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import NavigationMenu from './components/navigation/NavigationMenu';
// import ConsoleSanitizer from './utils/ConsoleSanitizer';
import logger from './utils/logger';
import TermsAndConditionsList from './components/Terms/TermsAndConditionsList';
import AddTermsAndConditions from './components/Terms/AddTermsAndConditions';
import SignInSide from './pages/SignInSide';
import SessionExpirationHandler from './components/navigation/SessionExpirationHandler';
import ErrorBoundary from './components/common/ErrorBoundary';
import TokenValidityChecker from './components/common/TokenValidityChecker';
import { initDevToolsProtection } from './utils/devToolsProtection';
import { 
  getUserFromToken, 
  logout,
  User,
  forceCheckTokenValidity,
  isTokenValid
} from './utils/tokenUtils';

// Import Borrow components
import CustomerDetailsList from './components/Borrow/CustomerDetailsList';
import AddCustomer from './components/Borrow/AddCustomer';
import AddCustomerPayment from './components/Borrow/AddCustomerPayment';
import ViewCustomerPayments from './components/Borrow/ViewCustomerPayments';

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
  const [user, setUser] = useState<User>({
    isAuthenticated: false,
    name: '',
    role: '',
    components: []
  });

  useEffect(() => {
    // Instead of forcing a token check immediately, just get the user from token
    // if it's valid. This prevents unnecessary redirect when the app loads.
    const currentUser = getUserFromToken();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    logout();
    setUser({
      isAuthenticated: false,
      name: '',
      role: '',
      components: []
    });
  };

  return (
    <ErrorBoundary>
    <Router>
      {/* <ConsoleSanitizer /> */}
      
      {/* Add the session expiration handler if user is authenticated */}
      {user.isAuthenticated && <SessionExpirationHandler />}
      
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Header user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/" element={<Box>Home Page</Box>} />
          <Route path="/buy-accessories" element={<Box>Buy Accessories Page</Box>} />
          <Route path="/signIn" element={<SignInSide />} />
          
          {/* Terms and Conditions Routes - Protected with AuthGuard */}
          <Route 
            path="/terms" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN']}>
                <TermsAndConditionsList />
              </AuthGuard>
            } 
          />
          <Route 
            path="/terms/add" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN']}>
                <AddTermsAndConditions />
              </AuthGuard>
            } 
          />
          <Route 
            path="/terms/edit/:id" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN']}>
                <AddTermsAndConditions />
              </AuthGuard>
            } 
          />
          
          {/* Customer Borrow Routes - Protected with AuthGuard */}
          <Route 
            path="/admin/customer/list" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN', 'EMPLOYEE']}>
                <CustomerDetailsList />
              </AuthGuard>
            } 
          />
          <Route 
            path="/admin/customer/add" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN', 'EMPLOYEE']}>
                <AddCustomer />
              </AuthGuard>
            } 
          />
          <Route 
            path="/admin/customer/payment/add/:id" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN', 'EMPLOYEE']}>
                <AddCustomerPayment />
              </AuthGuard>
            } 
          />
          <Route 
            path="/admin/customer/payment/view/:id" 
            element={
              <AuthGuard user={user} requiredRoles={['ADMIN', 'EMPLOYEE']}>
                <ViewCustomerPayments />
              </AuthGuard>
            } 
          />
        </Routes>
      </Box>
    </Router>
    </ErrorBoundary>
  );
};

export default App;