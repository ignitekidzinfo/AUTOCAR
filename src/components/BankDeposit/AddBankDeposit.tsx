import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Container, 
  TextField, 
  Stack,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Avatar,
  Divider,
  InputAdornment
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { 
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import apiClient from '../../Services/apiService';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

// Interface matching the backend DTO
interface BankDepositDTO {
  id?: number;
  depositDate: string;
  amount: number;
}

const AddBankDeposit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [depositDate, setDepositDate] = useState<dayjs.Dayjs | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchDeposit(id);
    }
  }, [id]);

  const fetchDeposit = async (depositId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/deposits/getById/${depositId}`);
      const deposit = response.data;
      
      setDepositDate(dayjs(deposit.depositDate));
      setAmount(deposit.amount.toString());
    } catch (err) {
      console.error('Error fetching deposit:', err);
      setError('Failed to load deposit details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositDate) {
      setError('Please select a deposit date');
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const depositData: BankDepositDTO = {
      depositDate: depositDate.format('YYYY-MM-DD'),
      amount: Number(amount)
    };
    
    try {
      if (isEditing && id) {
        // Update existing deposit
        await apiClient.patch(
          `/api/deposits/update/${id}`,
          null,
          { params: { newAmount: Number(amount) } }
        );
        setSuccessMessage('Deposit updated successfully!');
      } else {
        // Create new deposit
        await apiClient.post('/api/deposits/add', depositData);
        setSuccessMessage('Deposit added successfully!');
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/bank-deposits');
      }, 1500);
    } catch (err) {
      console.error('Error saving deposit:', err);
      setError('Failed to save deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDepositDate(null);
    setAmount('');
    setError('');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            bgcolor: theme.palette.primary.main, 
            p: 2, 
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Avatar sx={{ bgcolor: 'white', mr: 2 }}>
            <AccountBalanceIcon sx={{ color: theme.palette.primary.main }} />
          </Avatar>
          <Typography variant="h5" component="h1" fontWeight="medium">
            {isEditing ? 'Edit Bank Deposit' : 'Add Bank Deposit'}
          </Typography>
        </Box>
        
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Breadcrumbs sx={{ mb: 3 }}>
            <MuiLink component={RouterLink} to="/admin/dashboard" underline="hover" color="inherit">
              Home
            </MuiLink>
            <MuiLink component={RouterLink} to="/admin/bank-deposits" underline="hover" color="inherit">
              List Bank Deposit
            </MuiLink>
            <Typography color="text.primary">
              {isEditing ? 'Edit Bank Deposit' : 'Add New Bank Deposit'}
            </Typography>
          </Breadcrumbs>
          
          <Divider sx={{ mb: 3 }} />
          
          {loading && !isEditing ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 1,
                    boxShadow: 1
                  }}
                >
                  {error}
                </Alert>
              )}
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <CalendarIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6" fontWeight="medium">
                          Deposit Date
                        </Typography>
                      </Box>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          value={depositDate}
                          onChange={(newValue) => setDepositDate(newValue)}
                          format="DD-MM-YYYY"
                          slots={{
                            openPickerIcon: () => <CalendarIcon />
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              size: isMobile ? "small" : "medium"
                            }
                          }}
                          sx={{
                            width: '100%',
                            '& .MuiInputBase-root': {
                              borderRadius: 1
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6" fontWeight="medium">
                          Deposit Amount
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Enter Deposit Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          inputProps: {
                            min: 0,
                            step: 0.01
                          },
                          startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'center',
                  gap: 2
                }}
              >
                <Button 
                  variant="contained" 
                  type="submit" 
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    bgcolor: theme.palette.success.main, 
                    '&:hover': { bgcolor: theme.palette.success.dark },
                    boxShadow: 2,
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : isEditing ? 'Update Deposit' : 'Save Deposit'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    borderColor: theme.palette.grey[400],
                    color: theme.palette.grey[700],
                    '&:hover': {
                      borderColor: theme.palette.grey[600],
                      bgcolor: theme.palette.grey[50]
                    },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Card>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success"
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddBankDeposit; 