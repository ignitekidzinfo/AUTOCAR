import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Container,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Chip,
  Skeleton,
  Breadcrumbs,
  Link as MuiLink,
  InputAdornment,
  TextField
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  CalendarToday as CalendarIcon, 
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import apiClient from '../../Services/apiService';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

// Interface matching the backend DTO
interface BankDepositDTO {
  id: number;
  depositDate: string;
  amount: number;
}

const BankDepositList: React.FC = () => {
  const [deposits, setDeposits] = useState<BankDepositDTO[]>([]);
  const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(null);
  const [toDate, setToDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Function to fetch all deposits without date filtering
  const fetchAllDeposits = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/deposits/getAll');
      console.log('API Response:', response.data);
      setDeposits(response.data || []);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to load bank deposits. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch deposits with date filtering
  const fetchDepositsByDateRange = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/deposits/between', {
        params: {
          start: fromDate.format('YYYY-MM-DD'),
          end: toDate.format('YYYY-MM-DD')
        }
      });
      console.log('Date Range Response:', response.data);
      setDeposits(response.data || []);
    } catch (err) {
      console.error('Error fetching deposits by date range:', err);
      setError('Failed to load bank deposits for the selected date range.');
    } finally {
      setLoading(false);
    }
  };

  // Load all deposits on initial component mount
  useEffect(() => {
    fetchAllDeposits();
  }, []);

  const handleAddDeposit = () => {
    navigate('/admin/add-bank-deposit');
  };

  const handleEditDeposit = (id: number) => {
    navigate(`/admin/edit-bank-deposit/${id}`);
  };

  const getTotalDeposit = (): number => {
    return deposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
  };

  // Safe method to format amount with toFixed
  const formatAmount = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) {
      return '0.0';
    }
    return amount.toFixed(1);
  };

  // Mobile-friendly card view of deposits
  const renderMobileView = () => {
    if (loading) {
      return Array(3).fill(0).map((_, index) => (
        <Box key={index} mb={2}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        </Box>
      ));
    }

    if (deposits.length === 0) {
      return (
        <Card sx={{ mb: 2, boxShadow: 2, borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">No deposits found</Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {deposits.map((deposit, index) => (
          <Card 
            key={deposit.id || index} 
            sx={{ 
              mb: 2, 
              boxShadow: 2, 
              borderRadius: 2,
              position: 'relative',
              overflow: 'visible',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -12,
                left: 16,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {index + 1}
            </Box>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Deposit Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {deposit.depositDate ? dayjs(deposit.depositDate).format('DD-MM-YYYY') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary" align="right" sx={{ display: 'block' }}>
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" align="right">
                    ₹{formatAmount(deposit.amount)}
                  </Typography>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => handleEditDeposit(deposit.id)}
                  disabled={!deposit.id}
                  sx={{ ml: 'auto' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
        <Card sx={{ mb: 2, boxShadow: 2, borderRadius: 2, bgcolor: theme.palette.primary.light }}>
          <CardContent>
            <Grid container alignItems="center">
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="white">
                  Total Deposit
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" fontWeight="bold" align="right" color="white">
                  ₹{formatAmount(getTotalDeposit())}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </>
    );
  };

  // Desktop view with table
  const renderDesktopView = () => {
    return (
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Sr.No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Deposit Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount (₹)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Skeleton variant="rectangular" width="100%" height={40} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No deposits found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              deposits.map((deposit, index) => (
                <TableRow 
                  key={deposit.id || index}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: theme.palette.action.hover 
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {deposit.depositDate ? dayjs(deposit.depositDate).format('DD-MM-YYYY') : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="medium">
                      {formatAmount(deposit.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEditDeposit(deposit.id)}
                      disabled={!deposit.id}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow sx={{ bgcolor: theme.palette.primary.light }}>
              <TableCell colSpan={2} align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                Total Amount
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                {formatAmount(getTotalDeposit())}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h5" component="h1" fontWeight="medium">
            Bank Deposit List
          </Typography>
        </Box>
        
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={RouterLink} to="/admin/dashboard" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">List Bank Deposit</Typography>
        </Breadcrumbs>
  
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3.5}>
            <Typography variant="subtitle2" gutterBottom>From Date</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                format="DD-MM-YYYY"
                slots={{
                  openPickerIcon: () => <CalendarIcon />
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
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
          </Grid>
          
          <Grid item xs={12} sm={6} md={3.5}>
            <Typography variant="subtitle2" gutterBottom>To Date</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                format="DD-MM-YYYY"
                slots={{
                  openPickerIcon: () => <CalendarIcon />
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
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
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ mt: { xs: 1, md: 3 } }}>
              <Button 
                variant="contained"
                color="primary" 
                onClick={fetchDepositsByDateRange}
                startIcon={<SearchIcon />}
                fullWidth
                sx={{ 
                  height: 40,
                  textTransform: 'none',
                  boxShadow: 1
                }}
              >
                Search
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ mt: { xs: 1, md: 3 }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAddDeposit}
                startIcon={<AddIcon />}
                sx={{ 
                  height: 40,
                  textTransform: 'none',
                  bgcolor: theme.palette.success.main,
                  '&:hover': {
                    bgcolor: theme.palette.success.dark
                  },
                  boxShadow: 1
                }}
              >
                Add Deposit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#FFEBEE', borderRadius: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Paper>
      )}
      
      {isMobile ? renderMobileView() : renderDesktopView()}
      
      {/* Summary card for mobile and tablet */}
      {!isMobile && isTablet && deposits.length > 0 && (
        <Box mt={3}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.primary.light, color: 'white' }}>
            <Typography variant="h6" align="center">
              Total Deposit Amount: ₹{formatAmount(getTotalDeposit())}
            </Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default BankDepositList; 