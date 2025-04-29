import * as React from 'react';
import { styled, Theme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Adjust drawer width
const drawerWidth = 240;

// Create a styled component for the toggle button that ensures it sits above all content
const StyledToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  border: '1px solid',
  borderColor: theme.palette.divider,
  width: 40,
  height: 40,
  borderRadius: '50%',
  zIndex: 9999, // Very high z-index to ensure it's above everything
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export default function SideMenu() {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Define collapsed width in pixels
  const collapsedWidth = 56; // equivalent to theme.spacing(7)

  const handleLogout = () => {
    try {
      // Force immediate redirect to prevent auth state issues
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('userData');
      navigate('/signIn');
      // Then call the context logout for complete cleanup
      setTimeout(() => {
        logout();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/signIn';
    }
  };

  return (
    <>
      <MuiDrawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarOpen ? drawerWidth : theme => theme.spacing(7),
          flexShrink: 0,
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          [`& .${drawerClasses.paper}`]: {
            width: sidebarOpen ? drawerWidth : theme => theme.spacing(7),
            overflowX: 'visible', // Allow button to overflow
            overflowY: sidebarOpen ? 'auto' : 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            padding: (theme) => theme.spacing(0, 1),
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5,
          }}
        >
          {sidebarOpen && <SelectContent />}
        </Box>
        <Divider />
        <Box
          sx={{
            overflowX: 'visible', // Allow button to overflow
            overflowY: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <MenuContent />
        </Box>
        
        {sidebarOpen && (
          <Stack
            direction="row"
            sx={{
              p: 2,
              gap: 1,
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                justifyContent: 'flex-start',
                p: 1,
                mb: 1,
                color: 'primary.main',
                borderColor: 'primary.main'
              }}
            >
              Logout
            </Button>
            <OptionsMenu />
          </Stack>
        )}
      </MuiDrawer>
      
      {/* Toggle button as a fixed element on the edge of the sidebar */}
      <StyledToggleButton
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        sx={(theme) => ({
          left: sidebarOpen ? `${drawerWidth}px` : `${collapsedWidth}px`,
          top: '50%',
          transform: 'translate(-50%, -50%)', // Center on the edge
          transition: theme.transitions.create('left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: { xs: 'none', sm: 'none', md: 'flex' }, // Hide on mobile screens
        })}
      >
        {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </StyledToggleButton>
    </>
  );
}
