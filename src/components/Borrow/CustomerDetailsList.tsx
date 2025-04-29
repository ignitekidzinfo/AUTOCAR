import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Card,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  useMediaQuery,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Tooltip,
  Divider,
  Avatar,
  tableCellClasses,
  styled
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PaymentsIcon from '@mui/icons-material/Payments';
import apiClient from 'Services/apiService';

// Updated interface to match the API response format
interface BorrowDTO {
  borrowId: number;
  customerId?: number;
  customerName: string;
  remainingPayment: number;
  remainingDate?: string;
}

interface Customer {
  id: number;
  name: string;
  totalRemaining: number;
}

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transition: 'background-color 0.2s ease',
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const CustomerDetailsList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      console.log('Fetching all borrows');
      // Using the provided API endpoint
      const response = await apiClient.get<BorrowDTO[]>('/api/borrows/getAll');
      console.log('API response:', response.data);
      
      // Extract unique customers from borrows data
      const uniqueCustomers = extractUniqueCustomers(response.data);
      setCustomers(uniqueCustomers);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to extract unique customers from borrows data
  const extractUniqueCustomers = (borrows: BorrowDTO[]): Customer[] => {
    // Create a map to store unique customers by name
    const customerMap = new Map<string, Customer>();
    
    borrows.forEach(borrow => {
      if (borrow && borrow.customerName) {
        const customerName = borrow.customerName.trim();
        
        if (!customerMap.has(customerName)) {
          // If customer doesn't exist in map, add them
          customerMap.set(customerName, {
            id: borrow.customerId || borrow.borrowId,
            name: customerName,
            totalRemaining: borrow.remainingPayment || 0
          });
        } else {
          // If customer already exists, update their total remaining amount
          const customer = customerMap.get(customerName)!;
          customer.totalRemaining += borrow.remainingPayment || 0;
        }
      }
    });
    
    // Convert map values to array
    return Array.from(customerMap.values());
  };

  const openEditCustomerDialog = (customer: Customer) => {
    setCurrentCustomer(customer);
    setNewCustomerName(customer.name);
    setEditDialogOpen(true);
  };

  const closeEditCustomerDialog = () => {
    setEditDialogOpen(false);
    setCurrentCustomer(null);
    setNewCustomerName('');
  };

  const handleUpdateCustomerName = async () => {
    if (!currentCustomer || !newCustomerName.trim()) {
      return;
    }

    setUpdateLoading(true);
    try {
      // In a real implementation, you would call an API to update the customer name
      console.log(`Updating customer ${currentCustomer.id} name to: ${newCustomerName}`);
      
      // For now, update the UI only
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === currentCustomer.id
            ? { ...customer, name: newCustomerName }
            : customer
        )
      );
      closeEditCustomerDialog();
    } catch (error) {
      console.error('Error updating customer name:', error);
      setError('Failed to update customer name. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to determine text color based on amount
  const getAmountColor = (amount: number): string => {
    if (amount <= 0) return theme.palette.success.main;
    if (amount > 10000) return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 } }}>
      <Card 
        elevation={4} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transition: 'all 0.3s ease',
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.light, 0.6)})`,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListAltIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0 }}>
              Customer Details
            </Typography>
          </Box>
          <Chip 
            label={`${customers.length} Customers`} 
            color="primary" 
            sx={{ 
              bgcolor: 'white', 
              color: theme.palette.primary.main,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} 
          />
        </Box>

        <Divider />

        <Box sx={{ p: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/customer/add')}
            sx={{ 
              mb: 3, 
              bgcolor: theme.palette.success.main, 
              '&:hover': { bgcolor: theme.palette.success.dark },
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Add New Customer
          </Button>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 8, flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress size={48} thickness={4} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading customers...
              </Typography>
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                my: 2, 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {error}
            </Alert>
          ) : customers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <PersonIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No customers found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add a customer to get started with payment tracking
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin/customer/add')}
              >
                Add First Customer
              </Button>
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              sx={{ 
                mt: 2, 
                overflowX: 'auto',
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              <Table aria-label="customer details table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell width="5%">Sr.No</StyledTableCell>
                    <StyledTableCell width="35%">Customer Name</StyledTableCell>
                    <StyledTableCell align="right" width="20%">Total Remaining</StyledTableCell>
                    <StyledTableCell width="40%">Action</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer, index) => (
                    <StyledTableRow key={customer.id || index}>
                      <StyledTableCell>
                        {index + 1}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.8),
                              width: 32,
                              height: 32,
                              mr: 2,
                              fontSize: '0.9rem'
                            }}
                          >
                            {customer.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {customer.name}
                          </Typography>
                          <Tooltip title="Edit customer name">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => openEditCustomerDialog(customer)}
                              sx={{ 
                                ml: 1,
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Chip
                          label={`${customer.totalRemaining.toFixed(1)}`}
                          sx={{
                            fontWeight: 'bold',
                            color: getAmountColor(customer.totalRemaining),
                            bgcolor: alpha(getAmountColor(customer.totalRemaining), 0.1),
                            border: `1px solid ${alpha(getAmountColor(customer.totalRemaining), 0.3)}`,
                          }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        {isMobile ? (
                          // Mobile layout - buttons stacked vertically
                          <Grid container direction="column" spacing={1}>
                            <Grid item>
                              <Button
                                fullWidth
                                variant="contained"
                                size="medium"
                                onClick={() => navigate(`/admin/customer/payment/add/${customer.id}`)}
                                sx={{ 
                                  bgcolor: '#f0ad4e', 
                                  color: 'white', 
                                  '&:hover': { bgcolor: '#ec971f' },
                                  textTransform: 'none',
                                  fontSize: '0.8rem',
                                  py: 1,
                                  px: 2,
                                  borderRadius: 1.5,
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                              >
                                Add Remaining
                              </Button>
                            </Grid>
                            <Grid item>
                              <Button
                                fullWidth
                                variant="contained"
                                size="medium"
                                onClick={() => navigate(`/admin/customer/payment/view/${customer.id}`)}
                                sx={{ 
                                  bgcolor: '#5bc0de', 
                                  color: 'white', 
                                  '&:hover': { bgcolor: '#31b0d5' },
                                  textTransform: 'none',
                                  fontSize: '0.8rem',
                                  py: 1,
                                  px: 2,
                                  borderRadius: 1.5,
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                              >
                                View Remaining
                              </Button>
                            </Grid>
                          </Grid>
                        ) : isTablet ? (
                          // Tablet layout - buttons in two rows
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                onClick={() => navigate(`/admin/customer/payment/add/${customer.id}`)}
                                sx={{ 
                                  bgcolor: '#f0ad4e', 
                                  color: 'white', 
                                  '&:hover': { bgcolor: '#ec971f' },
                                  textTransform: 'none',
                                  px: 1
                                }}
                              >
                                Add Remaining Payment
                              </Button>
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                onClick={() => navigate(`/admin/customer/payment/view/${customer.id}`)}
                                sx={{ 
                                  bgcolor: '#5bc0de', 
                                  color: 'white', 
                                  '&:hover': { bgcolor: '#31b0d5' },
                                  textTransform: 'none',
                                  px: 1
                                }}
                              >
                                View Remaining Payment
                              </Button>
                            </Grid>
                          </Grid>
                        ) : (
                          // Desktop layout - buttons in a row
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => navigate(`/admin/customer/payment/add/${customer.id}`)}
                              sx={{ 
                                bgcolor: '#f0ad4e', 
                                color: 'white', 
                                '&:hover': { bgcolor: '#ec971f' },
                                textTransform: 'none',
                                px: 1
                              }}
                            >
                              Add Remaining Payment
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => navigate(`/admin/customer/payment/view/${customer.id}`)}
                              sx={{ 
                                bgcolor: '#5bc0de', 
                                color: 'white', 
                                '&:hover': { bgcolor: '#31b0d5' },
                                textTransform: 'none',
                                px: 1
                              }}
                            >
                              View Remaining Payment
                            </Button>
                          </Stack>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>

      {/* Edit Customer Name Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={closeEditCustomerDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          px: 3,
          py: 2
        }}>
          Update Customer Name
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ pt: 1, minWidth: '300px' }}>
            <TextField
              label="Customer Name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              fullWidth
              autoFocus
              margin="dense"
              variant="outlined"
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeEditCustomerDialog} 
            disabled={updateLoading}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateCustomerName}
            disabled={updateLoading || !newCustomerName.trim()}
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            {updateLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetailsList; 
