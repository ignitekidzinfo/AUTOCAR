import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Breadcrumbs,
  Alert,
  Paper
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import apiClient from 'Services/apiService';

// Interface matching the expected BorrowDTO for the API
interface BorrowDTO {
  customerName: string;
  remainingDate?: string;
  remainingPayment?: number;
}

const AddCustomer: React.FC = () => {
  const [customerName, setCustomerName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a payload that matches the expected BorrowDTO format
      // Format date as YYYY-MM-DD for the backend
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const payload: BorrowDTO = {
        customerName: customerName,
        remainingDate: formattedDate,
        remainingPayment: 0 // Initial payment as 0
      };
      
      console.log('Creating new customer with payload:', payload);
      // Using the endpoint from the provided controller
      await apiClient.post('/api/borrows/add', payload);
      
      setSuccess(true);
      // Redirect to customer list after success
      setTimeout(() => navigate('/admin/customer/list'), 1500);
    } catch (error) {
      console.error('Error adding customer:', error);
      setError('Failed to add customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCustomerName('');
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link to="/admin/customer/list" style={{ textDecoration: 'none', color: 'inherit' }}>
          List Customer Details
        </Link>
        <Typography color="text.primary">Add New Customer</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Add Customer
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Customer added successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Customer Name
              </Typography>
              <TextField
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter Customer Name"
                variant="outlined"
                disabled={loading}
                sx={{ bgcolor: 'white' }}
              />
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: '#673ab7',
                  color: 'white',
                  '&:hover': { bgcolor: '#5e35b1' },
                  px: 3
                }}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={handleReset}
                disabled={loading}
                sx={{
                  bgcolor: '#673ab7',
                  color: 'white',
                  '&:hover': { bgcolor: '#5e35b1' },
                  px: 3
                }}
              >
                Reset
              </Button>
            </Stack>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddCustomer; 