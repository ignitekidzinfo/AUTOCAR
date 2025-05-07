import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Cache configuration
const CACHE_KEY = 'bank_deposits_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache to avoid localStorage overhead
let depositsCache = {
  data: null as BankDepositDTO[] | null,
  timestamp: 0,
  filters: {
    fromDate: null as string | null,
    toDate: null as string | null
  }
};

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Check cache and load data on component mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        // Check memory cache first (fastest)
        if (depositsCache.data && Date.now() - depositsCache.timestamp < CACHE_DURATION) {
          setDeposits(depositsCache.data);
          setInitialLoading(false);
          return true;
        }
        
        // Try localStorage next
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp, filters } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setDeposits(data);
            
            // If we had filters applied, restore them
            if (filters.fromDate) setFromDate(dayjs(filters.fromDate));
            if (filters.toDate) setToDate(dayjs(filters.toDate));
            
            // Update memory cache
            depositsCache = { 
              data, 
              timestamp, 
              filters 
            };
            
            setInitialLoading(false);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error("Cache error:", error);
        return false;
      }
    };
    
    // If cache loading fails, fetch from API
    if (!loadFromCache()) {
      fetchAllDeposits(true);
    } else {
      // Still refresh data in background to keep it updated
      fetchAllDeposits(false);
    }
  }, []);

  // Function to fetch all deposits without date filtering
  const fetchAllDeposits = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setInitialLoading(true);
    }
    setError('');
    
    try {
      const response = await apiClient.get('/api/deposits/getAll');
      const depositsData = response.data || [];
      
      // Update state
      setDeposits(depositsData);
      
      // Update cache
      depositsCache = {
        data: depositsData,
        timestamp: Date.now(),
        filters: {
          fromDate: null,
          toDate: null
        }
      };
      
      // Store in localStorage for persistence
      localStorage.setItem(CACHE_KEY, JSON.stringify(depositsCache));
      
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to load bank deposits. Please try again later.');
      
      // Keep existing data if we have it
      if (deposits.length === 0) {
        setDeposits([]);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [deposits.length]);

  // Function to fetch deposits with date filtering
  const fetchDepositsByDateRange = useCallback(async () => {
    if (!fromDate || !toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    setLoading(true);
    setError('');
    
    const fromDateStr = fromDate.format('YYYY-MM-DD');
    const toDateStr = toDate.format('YYYY-MM-DD');
    
    try {
      const response = await apiClient.get('/api/deposits/between', {
        params: {
          start: fromDateStr,
          end: toDateStr
        }
      });
      
      const depositsData = response.data || [];
      
      // Update state
      setDeposits(depositsData);
      
      // Update cache with filter information
      depositsCache = {
        data: depositsData,
        timestamp: Date.now(),
        filters: {
          fromDate: fromDateStr,
          toDate: toDateStr
        }
      };
      
      // Store in localStorage with filter info
      localStorage.setItem(CACHE_KEY, JSON.stringify(depositsCache));
      
    } catch (err) {
      console.error('Error fetching deposits by date range:', err);
      setError('Failed to load bank deposits for the selected date range.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const handleAddDeposit = useCallback(() => {
    navigate('/admin/add-bank-deposit');
  }, [navigate]);

  const handleEditDeposit = useCallback((id: number) => {
    navigate(`/admin/edit-bank-deposit/${id}`);
  }, [navigate]);

  // Memoized calculation for total deposit amount
  const totalDeposit = useMemo(() => 
    deposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0),
  [deposits]);

  // Safe method to format amount with toFixed
  const formatAmount = useCallback((amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) {
      return '0.0';
    }
    return amount.toFixed(1);
  }, []);

  // Handle date change
  const handleFromDateChange = useCallback((newValue: dayjs.Dayjs | null) => {
    setFromDate(newValue);
  }, []);

  const handleToDateChange = useCallback((newValue: dayjs.Dayjs | null) => {
    setToDate(newValue);
  }, []);

  // Memoize the mobile cards to prevent unnecessary re-renders
  const mobileCards = useMemo(() => {
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
                  ₹{formatAmount(totalDeposit)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </>
    );
  }, [deposits, theme, formatAmount, handleEditDeposit, totalDeposit]);

  // Mobile-friendly card view of deposits
  const renderMobileView = useCallback(() => {
    if (initialLoading) {
      return Array(3).fill(0).map((_, index) => (
        <Box key={index} mb={2}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        </Box>
      ));
    }

    return mobileCards;
  }, [initialLoading, mobileCards]);

  // Memoize table rows to prevent re-rendering all rows when only one changes
  const tableRows = useMemo(() => {
    return deposits.map((deposit, index) => (
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
    ));
  }, [deposits, theme, formatAmount, handleEditDeposit]);

  // Desktop view with table
  const renderDesktopView = useCallback(() => {
    if (initialLoading) {
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
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Skeleton variant="rectangular" width="100%" height={40} />
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    
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
            {deposits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No deposits found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tableRows
            )}
            <TableRow sx={{ bgcolor: theme.palette.primary.light }}>
              <TableCell colSpan={2} align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                Total Amount
              </TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                {formatAmount(totalDeposit)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [initialLoading, deposits.length, theme, formatAmount, tableRows, totalDeposit]);

  // Memoize the summary card for tablet view
  const summaryCard = useMemo(() => {
    if (!isMobile && isTablet && deposits.length > 0) {
      return (
        <Box mt={3}>
          <Paper sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.primary.light, color: 'white' }}>
            <Typography variant="h6" align="center">
              Total Deposit Amount: ₹{formatAmount(totalDeposit)}
            </Typography>
          </Paper>
        </Box>
      );
    }
    return null;
  }, [isMobile, isTablet, deposits.length, theme, formatAmount, totalDeposit]);

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
                onChange={handleFromDateChange}
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
                onChange={handleToDateChange}
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
      {summaryCard}
    </Container>
  );
};

export default BankDepositList; 