import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventNoteIcon from '@mui/icons-material/EventNote';
import QueueIcon from '@mui/icons-material/Queue';
import HistoryIcon from '@mui/icons-material/History';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import GavelIcon from '@mui/icons-material/Gavel';
import logger from '../../utils/logger';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  requiredRole?: string;
}

const navigationItems: NavItem[] = [
  { name: 'Manage User', path: '/admin/employeeManagement', icon: <PersonIcon /> },
  { name: 'Master', path: '/master', icon: <SettingsIcon /> },
  { name: 'Report', path: '/report', icon: <DescriptionIcon /> },
  { name: 'Account Report', path: '/accountReport', icon: <ReceiptIcon /> },
  { name: 'Payment', path: '/payment', icon: <PaymentIcon /> },
  { name: 'Purchase', path: '/purchase', icon: <ShoppingCartIcon /> },
  { name: 'Vehicle Registration', path: '/vehicleRegistration', icon: <DirectionsCarIcon /> },
  { name: 'Bookings', path: '/bookings', icon: <EventNoteIcon /> },
  { name: 'Service Queue', path: '/serviceQueue', icon: <QueueIcon /> },
  { name: 'Service History', path: '/serviceHistory', icon: <HistoryIcon /> },
  { name: 'Counter Sale', path: '/counterSale', icon: <StorefrontIcon /> },
  { name: 'Quotation', path: '/quotation', icon: <DescriptionIcon /> },
  { name: 'Insurance', path: '/insurance', icon: <SecurityIcon /> },
  { name: 'Manage Repairs', path: '/repairs', icon: <BuildIcon /> },
  { name: 'Manage Stock', path: '/stock', icon: <InventoryIcon /> },
  { name: 'Terms & Conditions', path: '/terms', icon: <GavelIcon /> },
];

interface NavigationMenuProps {
  components: string[];
  userRole?: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ components, userRole = '' }) => {
  logger.info('Authorized components:', components);
  logger.info('User role:', userRole);

  // If the user is an admin, show all navigation items
  // Otherwise, filter based on authorized components
  const authorizedItems = userRole === 'ADMIN' 
    ? navigationItems 
    : navigationItems.filter(item => components.includes(item.name));

  if (authorizedItems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">No authorized components found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#2c3e50', fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {authorizedItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
            <Paper
              component={Link}
              to={item.path}
              elevation={2}
              sx={{
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  bgcolor: 'action.hover',
                },
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              <Box sx={{ 
                color: 'primary.main',
                fontSize: '3rem',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  textAlign: 'center',
                  px: 2
                }}
              >
                {item.name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default NavigationMenu; 