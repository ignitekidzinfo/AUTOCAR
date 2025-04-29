import React, { useEffect, useState } from 'react';
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

// Updated to match backend DTO (ManageTermsDto)
interface TermsDto {
  manageTermsId: number;
  selectNoteOn: string;
  writeTerms: string;
}

const TermsAndConditionsList: React.FC = () => {
  const [terms, setTerms] = useState<TermsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, open: boolean}>({
    message: '',
    open: false
  });
  const navigate = useNavigate();
  const { showNotification, clearNotifications } = useNotification();

  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting to fetch terms and conditions from API...");
      const response = await apiClient.get('manageTerms/all');
      
      console.log("API Response:", response.data);
      
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
        
        // Debug data
        console.log("Processed terms data:", termsData);
        
        // Update state with processed data
        setTerms(termsData || []);
      } else {
        console.warn("No data in API response");
        setError('Failed to fetch terms and conditions - no data returned');
        setTerms([]);
      }
    } catch (error) {
      console.error("Error in fetchTerms:", error);
      logger.error('Error fetching terms and conditions:', error);
      setError('Error connecting to server. Please try again later.');
      setTerms([]);
      showNotification({
        message: 'Failed to connect to server',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch terms only once when component mounts
    fetchTerms();
    
    // Clear any existing notifications when component unmounts
    return () => {
      clearNotifications();
    };
  }, []); // Empty dependency array ensures it only runs once on mount

  const handleAdd = () => {
    console.log("Navigating to add terms page");
    navigate('/admin/terms/add');
  };

  const handleEdit = (id: number) => {
    // More detailed logs
    console.log(`Navigating to edit page for term ID: ${id}`);
    console.log(`Current URL: ${window.location.href}`);
    console.log(`Target URL: /admin/terms/edit/${id}`);
    
    // Use complete path
    navigate(`/admin/terms/edit/${id}`);
    
    // After navigation attempt
    setTimeout(() => {
      console.log(`URL after navigation: ${window.location.href}`);
    }, 500);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this terms and condition?')) {
      try {
        const response = await apiClient.delete(`manageTerms/delete?id=${id}`);
        if (response.data && response.data.success) {
          showNotification({
            message: 'Terms and condition deleted successfully',
            type: 'success',
          });
          fetchTerms();
        } else {
          showNotification({
            message: response.data?.message || 'Failed to delete terms and condition',
            type: 'error',
          });
        }
      } catch (error) {
        logger.error('Error deleting terms and condition:', error);
        showNotification({
          message: 'Failed to delete terms and condition',
          type: 'error',
        });
      }
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({...prev, open: false}));
  };

  const handleRefresh = () => {
    fetchTerms();
  };

  const filteredTerms = terms.filter((term) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      term.selectNoteOn?.toLowerCase().includes(searchLower) ||
      term.writeTerms?.toLowerCase().includes(searchLower)
    );
  });

  console.log("Rendering with terms:", terms);
  console.log("Filtered terms length:", filteredTerms.length);

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
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : terms.length === 0 ? (
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
        ) : (
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
                {filteredTerms.map((term, index) => (
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
                            console.error("Cannot edit: No manageTermsId found for this term");
                            showNotification({
                              message: 'Cannot edit: Missing term ID',
                              type: 'error',
                            });
                            return;
                          }
                          console.log("Clicked edit for ID:", term.manageTermsId);
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
                ))}
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