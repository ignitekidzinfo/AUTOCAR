import React, { useEffect, useState } from "react";
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

interface Customer {
  email: string;
  firstName: string;
  lastName?: string;
  mobileNumber: number;
  address: string;
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/user/getAllUsers");
      setCustomers(response.data.list); // Use 'list' from response
      setError(null);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (email: string) => {
    try {
      await apiClient.delete(`/customers/${email}`);
      setCustomers((prev) => prev.filter((c) => c.email !== email));
    } catch (error) {
      console.error("Error deleting customer:", error);
      setError("Failed to delete customer. Please try again.");
      // Add a timeout to clear the error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const renderCustomerName = (customer: Customer) => {
    const fullName = `${customer.firstName} ${customer.lastName || ""}`.trim();
    const initials = customer.firstName.charAt(0) + (customer.lastName ? customer.lastName.charAt(0) : "");
    
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
          {initials}
        </Avatar>
        <Typography variant="body1" fontWeight="medium">
          {fullName}
        </Typography>
      </Stack>
    );
  };

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
          {/* Summary Cards */}
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

          {/* Main Content */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                mx: 3, 
                mb: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden'
              }}
            >
              <Table sx={{ minWidth: 650 }}>
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
              customers.map((customer, index) => (
                      <TableRow 
                        key={index} 
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{renderCustomerName(customer)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {customer.address}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<PhoneIcon />} 
                            label={customer.mobileNumber} 
                            size="small" 
                            variant="outlined"
                            sx={{ borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Edit Customer">
                              <IconButton 
                                size="small" 
                                color="primary"
                      onClick={() => console.log("Edit", customer.email)}
                                sx={{ 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Customer">
                              <IconButton 
                                size="small" 
                                color="error"
                      onClick={() => handleDelete(customer.email)}
                                sx={{ 
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
              ))
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerList;
