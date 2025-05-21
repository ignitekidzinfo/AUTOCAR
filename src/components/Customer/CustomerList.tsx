import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "Services/apiService";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Avatar,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Numbers as NumbersIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

// Memory cache for customer data to improve loading speed
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let customerCache = {
  data: null as Customer[] | null,
  timestamp: 0
};

interface Customer {
  email: string;
  firstName: string | null;
  lastName?: string | null;
  mobileNumber: number | string;
  address: string | null;
  customerId?: string | number;
  userId?: string | number;
  id?: string | number;
  aadharNo?: string;
  gstin?: string;
  hasValidId?: boolean;
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Optimized fetch function with caching
  const fetchCustomers = useCallback(async (): Promise<void> => {
    setLoading(true);
    
    try {
      // Check if we have cached data that's still fresh
      if (customerCache.data && (Date.now() - customerCache.timestamp < CACHE_DURATION)) {
        console.log("Using cached customer data");
        setCustomers(customerCache.data);
        setLoading(false);
        return;
      }
      
      console.log("Fetching fresh customer data");
      const response = await apiClient.get<{list: any[]}>("/user/getAllUsers");
  
      const customerData = response.data?.list || [];
      console.log("Raw API response:", response.data);
      
      const sanitizedData = customerData.map((customer: any) => {
        // Log the exact customer object from API
        console.log("Raw customer object from API:", JSON.stringify(customer, null, 2));
        
        // Extract the userId directly from the response
        const userId = customer.userId;
        console.log(`Customer ${customer.firstName}: userId from API =`, userId);
        
        // Map API field names to our expected names
        return {
          // Basic info
          email: customer.email || '',
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          mobileNumber: customer.mobileNumber || '',
          address: customer.address || '',
          
          // ID fields - ensure all are the same value for consistency
          userId: userId,
          customerId: userId, 
          id: userId,
          
          // Handle the field name differences
          aadharNo: customer.adharNo || customer.aadharNo || '',
          gstin: customer.gstinno || customer.gstin || '',
          
          // Fields for the UI
          hasValidId: userId != null && userId !== undefined
        } as Customer;
      });
      
      // Debug the processed data
      console.log("Processed customer data:", sanitizedData);
      
      customerCache = {
        data: sanitizedData,
        timestamp: Date.now()
      };
      
      setCustomers(sanitizedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (email: string) => {
    try {
      await apiClient.delete(`/customers/${email}`);
      
      setCustomers((prev) => prev.filter((c) => c.email !== email));
      
      customerCache.data = null;
    } catch (error) {
      console.error("Error deleting customer:", error);
      setError("Failed to delete customer. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  const renderCustomerName = useCallback((customer: Customer) => {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
    
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0) : '?';
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0) : '';
    const initials = (firstInitial + lastInitial).toUpperCase();
    
    return (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar 
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.8),
            width: 36,
            height: 36,
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          {initials || '?'}
        </Avatar>
        <Typography variant="body1" fontWeight="medium">
          {fullName}
        </Typography>
      </Stack>
    );
  }, [theme]);

  const handleEditOpen = async (customer: Customer) => {
    setEditDialogOpen(true); 
    setEditLoading(true);
    setEditError(null);
    
    // Debug input customer first
    console.log("Customer selected for edit:", customer);
    
    // Get the userId directly from the customer object
    const userId = customer.userId;
    console.log("Using userId for API call:", userId);
    
    // Check if userId is valid
    if (userId == null || userId === undefined) {
      setEditError('Customer ID is missing. Cannot edit this customer.');
      setEditLoading(false);
      return;
    }
    
    try {
      // Make the API call with the userId
      console.log(`Making API call to /user/getUser/${userId}`);
      const response = await apiClient.get(`/user/getUser/${userId}`);
      console.log("API response:", response.data);
      
      const userDetails = response.data;
      
      // Create a complete customer object with all fields
      const updatedCustomer: Customer = {
        // Use customer object as base
        ...customer,
        
        // Update with API response data
        firstName: userDetails.firstName || customer.firstName || '',
        lastName: userDetails.lastName || customer.lastName || '',
        mobileNumber: userDetails.mobileNumber || customer.mobileNumber || '',
        address: userDetails.address || customer.address || '',
        
        // Handle field name differences
        aadharNo: userDetails.adharNo || userDetails.aadharNo || customer.aadharNo || '',
        gstin: userDetails.gstinno || userDetails.gstin || customer.gstin || '',
        
        // Ensure all ID fields are set
        userId: userId,
        customerId: userId,
        id: userId
      };
      
      console.log("Final customer data for edit form:", updatedCustomer);
      setEditCustomer(updatedCustomer);
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      // Provide more specific error information
      if (error.response?.status === 404) {
        setEditError(`Customer with ID ${userId} not found. The user may have been deleted.`);
      } else {
        setEditError(error.response?.data?.message || 'Failed to fetch customer details.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditCustomer(null);
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editCustomer) return;
    setEditCustomer({ ...editCustomer, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    if (!editCustomer) {
      setEditError("No customer data available for update.");
      return;
    }
    
    // Get the userId directly
    const userId = editCustomer.userId;
    
    console.log("Submitting update for customer with userId:", userId);
    
    if (userId == null || userId === undefined) {
      setEditError("Customer ID is missing. Cannot update this customer.");
      return;
    }
    
    setEditLoading(true);
    setEditError(null);
    
    try {
      // Create the payload with field names matching the API
      const payload = {
        firstName: editCustomer.firstName, 
        lastName: editCustomer.lastName || '',
        mobileNumber: editCustomer.mobileNumber,
        address: editCustomer.address,
        // Map our field names to API field names
        adharNo: editCustomer.aadharNo, // Note: API uses adharNo not aadharNo
        gstinno: editCustomer.gstin,    // Note: API uses gstinno not gstin
      };
      
      console.log(`Updating customer userId=${userId} with payload:`, payload);
      
      // Make the API call
      const response = await apiClient.patch(`/user/updateDetails/${userId}`, payload);
      console.log("Update API response:", response.data);
      
      // Update the local state with the edited data
      setCustomers((prev) =>
        prev.map((c) => {
          // Match on userId (most reliable)
          if (c.userId === userId) {
            return { 
              ...c, 
              ...payload,
              // Map API field names back to our field names for consistency
              aadharNo: payload.adharNo,
              gstin: payload.gstinno
            };
          }
          return c;
        })
      );
      
      // Clear cache to ensure fresh data on next load
      customerCache.data = null;
      
      setEditDialogOpen(false);
      
      // Show success message
      setError("Customer updated successfully");
      setTimeout(() => setError(null), 3000);
      
      // Refresh the list to ensure we have the latest data
      setTimeout(() => {
        fetchCustomers();
      }, 500);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update customer.';
      console.log("Error details:", errorMsg);
      setEditError(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };
  const customerList = useMemo(() => {
    if (!customers.length) return null;
    
    return customers.map((customer, index) => (
      <TableRow 
        key={customer.email || index} 
        hover
        sx={{ 
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&:last-child td, &:last-child th': { border: 0 },
          // Add a subtle indication for customers without valid IDs
          ...(customer.hasValidId === false && {
            bgcolor: alpha('#ffcdd2', 0.1),
            '&:hover': { bgcolor: alpha('#ffcdd2', 0.2) }
          })
        }}
      >
        <TableCell>{index + 1}</TableCell>
        <TableCell>{renderCustomerName(customer)}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {customer.address || 'No address'}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Chip 
            icon={<PhoneIcon />} 
            label={customer.mobileNumber || 'N/A'} 
            size="small" 
            variant="outlined"
            sx={{ borderRadius: 1.5 }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {customer.aadharNo || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {customer.gstin || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title={customer.hasValidId === false 
              ? "Cannot edit - missing ID"
              : `Edit Customer (ID: ${customer.customerId || customer.userId || customer.id || 'Unknown'})`}>
              <span> {/* Wrap to allow tooltip on disabled button */}
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => handleEditOpen(customer)}
                  disabled={customer.hasValidId === false}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                    '&.Mui-disabled': {
                      bgcolor: alpha(theme.palette.grey[400], 0.2),
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  }, [customers, renderCustomerName, theme, handleEditOpen]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        p: 3,
      }}
    >
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Customer Directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your customer database
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/AddCustomer")}
              sx={{ borderRadius: 2 }}
            >
              Add New Customer
            </Button>
          </Stack>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">Total Customers</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
                    {customers.length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            </Box>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  mx: { xs: 0, sm: 3 },
                  mb: 3, 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'auto',
                  minWidth: 600
                }}
              >
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableRow>
                      <TableCell width="5%" sx={{ fontWeight: 'bold' }}>Sr.No</TableCell>
                      <TableCell width="20%" sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell width="25%" sx={{ fontWeight: 'bold' }}>Address</TableCell>
                      <TableCell width="15%" sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                      <TableCell width="15%" sx={{ fontWeight: 'bold' }}>Aadhar No.</TableCell>
                      <TableCell width="15%" sx={{ fontWeight: 'bold' }}>GSTIN</TableCell>
                      <TableCell width="5%" align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length > 0 ? (
                      customerList
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <PersonIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.primary, 0.2) }} />
                            <Typography variant="h6" color="text.secondary">
                              No customers found
                            </Typography>
                            <Button 
                              variant="outlined" 
                              startIcon={<AddIcon />}
                              onClick={() => navigate("/admin/AddCustomer")}
                              sx={{ mt: 1, borderRadius: 2 }}
                            >
                              Add Your First Customer
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Customer
          {editCustomer && (
            <Typography variant="caption" display="block" color="text.secondary">
              ID: {editCustomer.userId || 'Unknown'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {editLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <TextField
                label="First Name"
                name="firstName"
                value={editCustomer?.firstName || ''}
                onChange={handleEditChange}
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={editCustomer?.lastName || ''}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                label="Mobile Number"
                name="mobileNumber"
                value={editCustomer?.mobileNumber || ''}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                label="Address"
                name="address"
                value={editCustomer?.address || ''}
                onChange={handleEditChange}
                fullWidth
                required
                multiline
                rows={2}
              />
              <TextField
                label="Aadhar Number"
                name="aadharNo"
                value={editCustomer?.aadharNo || ''}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                label="GSTIN"
                name="gstin"
                value={editCustomer?.gstin || ''}
                onChange={handleEditChange}
                fullWidth
              />
              {editError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {editError}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="secondary">Cancel</Button>
          <Button 
            onClick={handleEditSubmit} 
            color="primary" 
            variant="contained" 
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} sx={{ mx: 1 }} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
