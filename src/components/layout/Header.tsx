import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { logout, isAuthenticated, userRole, userName } = useAuth();
  const location = useLocation();

  const shouldShowDashboard = isAuthenticated && (userRole === 'ADMIN' || userRole === 'EMPLOYEE');

  return (
    <AppBar position="static" sx={{ bgcolor: '#2c3e50', mb: 3 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          AutoCarCarePoint
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            sx={{ 
              bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Home
          </Button>
          <Button
            component={Link}
            to="/buy-accessories"
            color="inherit"
            sx={{ 
              bgcolor: location.pathname === '/buy-accessories' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Buy Accessories
          </Button>
          
          {shouldShowDashboard && (
            <Button
              component={Link}
              to="/dashboard"
              color="inherit"
              startIcon={<DashboardIcon />}
              sx={{ 
                bgcolor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              Dashboard
            </Button>
          )}

          {isAuthenticated && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              pl: 2
            }}>
              <AccountCircleIcon />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {userName} ({userRole})
              </Typography>
              <Button
                color="inherit"
                onClick={logout}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 