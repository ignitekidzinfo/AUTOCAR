import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Breadcrumbs,
  Alert,
  Paper,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  alpha
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import apiClient from 'Services/apiService';

// Updated interface to match the server-side BorrowDTO
interface BorrowDTO {
  borrowId?: number;
  customerName: string;
  remainingDate?: string;
  remainingPayment: number;
}

const AddCustomerPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [customerName, setCustomerName] = useState<string>('');
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [remainingAmount, setRemainingAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCustomer, setFetchingCustomer] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Format date as YYYY-MM-DD for the input field
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date as YYYY-MM-DD for the backend
  function formatDateForApi(inputDate: string): string {
    return inputDate; // Already in YYYY-MM-DD format for the backend
  }

  useEffect(() => {
    // Fetch customer data if id is available
    if (id && id !== 'undefined') {
      fetchCustomerData();
    } else {
      setFetchingCustomer(false);
      setError('Invalid customer ID. Please select a valid customer from the list.');
    }
  }, [id]);

  const fetchCustomerData = async () => {
    setFetchingCustomer(true);
    try {
      console.log('Fetching customer with ID:', id);
      
      // Try to get customer by ID first
      try {
        const customerResponse = await apiClient.get<BorrowDTO[]>(`/api/borrows/getById/${id}`);
        console.log('Customer response:', customerResponse.data);
        
        if (customerResponse.data && customerResponse.data.length > 0) {
          const customerData = customerResponse.data[0];
          setCustomerName(customerData.customerName || '');
          setCustomerId(Number(id));
          // We don't pre-fill amount - each payment is a new record
          setRemainingAmount('');
        } else {
          // If the direct ID lookup fails, try getting all borrows
          const allBorrowsResponse = await apiClient.get<BorrowDTO[]>('/api/borrows/getAll');
          const customerBorrow = allBorrowsResponse.data.find(
            borrow => borrow.borrowId === Number(id)
          );
          
          if (customerBorrow) {
            setCustomerName(customerBorrow.customerName || '');
            setCustomerId(Number(id));
            // We don't pre-fill amount - each payment is a new record
            setRemainingAmount('');
          } else {
            setError('Customer not found. Please try again or select a different customer.');
          }
        }
      } catch (idError) {
        console.error('Error fetching customer by ID:', idError);
        
        // Fallback to getting all borrows
        const response = await apiClient.get<BorrowDTO[]>('/api/borrows/getAll');
        const customerBorrow = response.data.find(
          borrow => borrow.borrowId === Number(id)
        );
        
        if (customerBorrow) {
          setCustomerName(customerBorrow.customerName || '');
          setCustomerId(Number(id));
          // We don't pre-fill amount - each payment is a new record
          setRemainingAmount('');
        } else {
          setError('Customer not found. Please try again or select a different customer.');
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data. Please try again.');
    } finally {
      setFetchingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !customerName || !remainingAmount) {
      setError('All fields are required');
      return;
    }

    if (isNaN(Number(remainingAmount)) || Number(remainingAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Always create a new payment record
      const payload: BorrowDTO = {
        customerName: customerName,
        remainingPayment: Number(remainingAmount),
        remainingDate: formatDateForApi(date)
      };
      
      console.log('Adding new payment record:', payload);
      await apiClient.post('/api/borrows/add', payload);
      
      setSuccess(true);
      setTimeout(() => navigate(`/admin/customer/payment/view/${customerId || id}`), 1500);
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDate(formatDateForInput(new Date()));
    setRemainingAmount('');
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 }, backgroundColor: alpha(theme.palette.background.default, 0.4) }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3, px: 1 }}
      >
        <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link to="/admin/customer/list" style={{ textDecoration: 'none', color: 'inherit' }}>
          List Customer Details
        </Link>
        <Typography color="text.primary">
          Add New Payment Record
        </Typography>
      </Breadcrumbs>

      <Card 
        elevation={4} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(to right bottom, #ffffff, #fcfcff)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ 
            bgcolor: theme.palette.primary.main, 
            color: 'white', 
            py: 2, 
            px: 3,
            mb: 3,
            borderBottom: `4px solid ${theme.palette.primary.dark}`
          }}>
            <Typography variant="h5" component="h1" fontWeight="500">
              Add Payment Record
            </Typography>
            {!fetchingCustomer && customerName && (
              <Typography variant="subtitle1" sx={{ mt: 0.5, opacity: 0.9 }}>
                for {customerName}
              </Typography>
            )}
          </Box>

          <Box sx={{ p: 3 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2
                }}
              >
                Payment added successfully! Redirecting...
              </Alert>
            )}

            {fetchingCustomer ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', my: 8 }}>
                <CircularProgress size={40} thickness={4} />
                <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                  Loading customer data...
                </Typography>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        Customer
                      </Typography>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          bgcolor: alpha(theme.palette.primary.light, 0.1),
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {customerName}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      Payment Date
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      variant="outlined"
                      disabled={loading}
                      required
                      sx={{ 
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarTodayIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                      Payment Amount
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={remainingAmount}
                      onChange={(e) => setRemainingAmount(e.target.value)}
                      placeholder="Enter Payment Amount"
                      variant="outlined"
                      required
                      disabled={loading}
                      sx={{ 
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="h6" color="text.secondary">₹</Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Stack 
                  direction={isMobile ? "column" : "row"} 
                  spacing={2}
                  sx={{ justifyContent: 'center' }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SaveIcon />}
                    sx={{
                      minWidth: isMobile ? '100%' : '180px',
                      bgcolor: theme.palette.success.main,
                      color: 'white',
                      '&:hover': { bgcolor: theme.palette.success.dark },
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Payment'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleReset}
                    disabled={loading}
                    startIcon={<RestartAltIcon />}
                    sx={{
                      minWidth: isMobile ? '100%' : '180px',
                      borderColor: theme.palette.grey[400],
                      color: theme.palette.text.primary,
                      '&:hover': { bgcolor: theme.palette.grey[100] },
                      py: 1.5,
                      borderRadius: 2
                    }}
                  >
                    Reset Form
                  </Button>
                </Stack>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => navigate('/admin/customer/list')}
                    sx={{ 
                      color: theme.palette.text.secondary,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                  >
                    Back to Customer List
                  </Button>
                </Box>
              </form>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddCustomerPayment; 