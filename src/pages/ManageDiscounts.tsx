import React from 'react';
import { Box, Container, Paper, Typography, Breadcrumbs, Link, styled } from '@mui/material';
import DiscountManagement from '../components/StockManagement/DiscountManagement';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  background: theme.palette.mode === 'dark' ? '#1A2027' : '#ffffff',
}));

const ManageDiscounts: React.FC = () => {
  const navigate = useNavigate();

  // Handle navigation
  const handleNavigation = (path: string) => () => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link 
            color="inherit" 
            onClick={handleNavigation('/admin/dashboard')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          <Link
            color="inherit"
            onClick={handleNavigation('/admin/transaction')}
            sx={{ cursor: 'pointer' }}
          >
            Transactions
          </Link>
          <Typography color="primary">Manage Discounts</Typography>
        </Breadcrumbs>

        <StyledPaper>
          <DiscountManagement />
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default ManageDiscounts; 