import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  AlertTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useNotification } from '../common/Notification';
import logger from '../../utils/logger';

// Cache configuration
const CACHE_KEY = 'terms_conditions_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache to avoid localStorage overhead
let termsCache = {
  data: null as TermsDto[] | null,
  timestamp: 0
};

// Updated to match backend DTO (ManageTermsDto)
interface TermsDto {
  manageTermsId: number;
  selectNoteOn: string;
  writeTerms: string;
}

const TermsAndConditionsList: React.FC = () => {
  const [terms, setTerms] = useState<TermsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, open: boolean}>({
    message: '',
    open: false
  });
  const navigate = useNavigate();
  const { showNotification, clearNotifications } = useNotification();

  // Prefetch cache data immediately on component mount
  useEffect(() => {
    const prefetchFromCache = () => {
      try {
        // Check memory cache first (fastest)
        if (termsCache.data && Date.now() - termsCache.timestamp < CACHE_DURATION) {
          setTerms(termsCache.data);
          setInitialLoading(false);
          return true;
        }
        
        // Try localStorage next
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setTerms(data);
            
            // Update memory cache too
            termsCache = { data, timestamp };
            
            setInitialLoading(false);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        logger.error("Cache error:", error);
        return false;
      }
    };
    
    // If we couldn't use cache, we'll fetch fresh data
    if (!prefetchFromCache()) {
      fetchTerms(true);
    } else {
      // If we used cache, still fetch updated data in the background
      fetchTerms(false);
    }
    
    // Clear any existing notifications when component unmounts
    return () => {
      clearNotifications();
    };
  }, []); // Empty dependency array ensures it only runs once on mount

  const fetchTerms = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setInitialLoading(true);
      }
      
      setError(null);
      
      const response = await apiClient.get('manageTerms/all');
      
      // Auto-close notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({...prev, open: false}));
      }, 3000);
      
      // Check if we have a response
      if (response.data) {
        // Try different response formats - handle both direct data and nested data structure
        let termsData;
        
        if (Array.isArray(response.data)) {
          // Direct array response
          termsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested data.data array response
          termsData = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Single object in data.data
          termsData = [response.data.data];
        } else if (typeof response.data === 'object' && !response.data.data) {
          // Direct object response without data property
          termsData = [response.data];
        } else {
          termsData = [];
        }
        
        // Update state with processed data
        setTerms(termsData || []);
        
        // Cache the data
        termsCache = {
          data: termsData || [],
          timestamp: Date.now()
        };
        
        // Also cache in localStorage for persistence
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: termsData || [],
          timestamp: Date.now()
        }));
      } else {
        logger.warn("No data in API response");
        setError('Failed to fetch terms and conditions - no data returned');
        
        // Only clear terms if we don't already have some
        if (terms.length === 0) {
          setTerms([]);
        }
      }
    } catch (error) {
      logger.error('Error fetching terms and conditions:', error);
      setError('Error connecting to server. Please try again later.');
      
      // Only clear terms if we don't already have some
      if (terms.length === 0) {
        setTerms([]);
      }
      
      showNotification({
        message: 'Failed to connect to server',
        type: 'error',
      });
    } finally {
      setInitialLoading(false);
    }
  }, [showNotification, terms.length]);

  const handleAdd = useCallback(() => {
    navigate('/admin/terms/add');
  }, [navigate]);

  const handleEdit = useCallback((id: number) => {
    navigate(`/admin/terms/edit/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this terms and condition?')) {
      try {
        setLoading(true);
        const response = await apiClient.delete(`manageTerms/delete?id=${id}`);
        if (response.data && response.data.success) {
          // Optimistic UI update
          const updatedTerms = terms.filter(term => term.manageTermsId !== id);
          setTerms(updatedTerms);
          
          // Update cache
          termsCache = {
            data: updatedTerms,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: updatedTerms,
            timestamp: Date.now()
          }));
          
          showNotification({
            message: 'Terms and condition deleted successfully',
            type: 'success',
          });
        } else {
          showNotification({
            message: response.data?.message || 'Failed to delete terms and condition',
            type: 'error',
          });
          
          // Refresh data in background
          fetchTerms(false);
        }
      } catch (error) {
        logger.error('Error deleting terms and condition:', error);
        showNotification({
          message: 'Failed to delete terms and condition',
          type: 'error',
        });
        
        // Refresh data in background
        fetchTerms(false);
      } finally {
        setLoading(false);
      }
    }
  }, [terms, fetchTerms, showNotification]);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({...prev, open: false}));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchTerms(true);
  }, [fetchTerms]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoize filtered terms to avoid recalculation on every render
  const filteredTerms = useMemo(() => {
    if (!searchTerm) return terms;
    
    const searchLower = searchTerm.toLowerCase();
    return terms.filter((term) => (
      term.selectNoteOn?.toLowerCase().includes(searchLower) ||
      term.writeTerms?.toLowerCase().includes(searchLower)
    ));
  }, [terms, searchTerm]);

  // Memoize table rows to prevent re-rendering of all rows when only one changes
  const tableRows = useMemo(() => {
    return filteredTerms.map((term, index) => (
      <TableRow 
        key={term.manageTermsId || index}
        sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}
      >
        <TableCell sx={{ verticalAlign: 'top', py: 2 }}>{index + 1}</TableCell>
        <TableCell sx={{ verticalAlign: 'top', py: 2 }}>{term.selectNoteOn || 'Job Card'}</TableCell>
        <TableCell sx={{
          width: '75%',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          padding: '16px',
          lineHeight: '1.5',
          verticalAlign: 'top'
        }}>
          {term.writeTerms || ''}
        </TableCell>
        <TableCell align="center" sx={{ verticalAlign: 'top', py: 2 }}>
          <IconButton 
            onClick={() => {
              if (!term.manageTermsId) {
                showNotification({
                  message: 'Cannot edit: Missing term ID',
                  type: 'error',
                });
                return;
              }
              handleEdit(term.manageTermsId);
            }} 
            size="small" 
            color="primary"
            disabled={!term.manageTermsId}
          >
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ));
  }, [filteredTerms, handleEdit, showNotification]);

  // Memoize empty state component
  const emptyState = useMemo(() => (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="body1">No terms and conditions found</Typography>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleRefresh}
        sx={{ mt: 2 }}
        size="small"
      >
        Refresh
      </Button>
    </Box>
  ), [handleRefresh]);

  return (
    <Box sx={{ 
      width: '100%',
      boxSizing: 'border-box',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Custom notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          onClose={handleCloseNotification}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      <Paper sx={{ 
        p: { xs: 2, sm: 3 },
        width: '100%',
        boxSizing: 'border-box',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Terms & Conditions List</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              size="small"
            >
              Add Terms & Conditions
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : terms.length === 0 ? emptyState : (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell width="5%" sx={{ fontWeight: 'bold' }}>Sr.No</TableCell>
                  <TableCell width="10%" sx={{ fontWeight: 'bold' }}>Note On</TableCell>
                  <TableCell width="75%" sx={{ fontWeight: 'bold' }}>Note</TableCell>
                  <TableCell width="10%" align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          ©{new Date().getFullYear()} Auto Car Care Point 
        </Typography>
      </Box>
    </Box>
  );
};

export default TermsAndConditionsList; 