import * as React from 'react';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AppNavbar from '../components/AppNavbar';
import Header from '../components/Header';
import MainGrid from '../components/MainGrid';
import SideMenu from '../components/SideMenu';
import AppTheme from '../theme/AppTheme';
import { chartsCustomizations } from 'theme/customizations/charts';
import { dataGridCustomizations } from 'theme/customizations/dataGrid';
import { datePickersCustomizations } from 'theme/customizations/datePickers';
import { treeViewCustomizations } from 'theme/customizations/treeView';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function AdminHeader(props: { disableCustomTheme?: boolean }) {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const drawerWidth = 240;
  const collapsedWidth = 56; // theme.spacing(7) equivalent in pixels

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh',
        overflow: 'hidden',
      }}>
        <SideMenu />
        <AppNavbar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            height: '100%',
            transition: theme => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
            overflow: 'hidden',
          }}
        >
          <Stack
            spacing={2}
            sx={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              overflow: 'auto',
              mx: 0, // No horizontal margin
              px: { xs: 2, sm: 3 }, // Use padding instead
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              width: '100%', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              mb: 2,
              pt: 2,
            }}>
              <Header />
            </Box>
            <Box sx={{ 
              width: '100%', 
              minWidth: 0, 
              overflow: 'auto',
            }}>
              <Outlet />
            </Box>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
