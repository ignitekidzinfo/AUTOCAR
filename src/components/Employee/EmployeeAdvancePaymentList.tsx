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
  Breadcrumbs,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Card,
  Stack
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import apiClient from '../../Services/apiService';

// Interface for employee data
interface EmployeePaymentDTO {
  id: number;
  name: string;
  joiningDate: string;
  salary: number;
  advancePaymentDate?: string;
  advancePayment?: number;
}

const EmployeeAdvancePaymentList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<EmployeePaymentDTO | null>(null);
  const [advancePayments, setAdvancePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch employee details and advance payments
  const fetchEmployeeData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/api/employees/${id}`);
      setEmployee(response.data);
      
      // For this demo, we'll just create a mock payment entry
      // In a real application, you would fetch actual payment records
      if (response.data && response.data.advancePayment) {
        setAdvancePayments([
          {
            id: 1,
            date: response.data.advancePaymentDate || new Date().toISOString(),
            amount: response.data.advancePayment
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError('Failed to load employee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load employee data on component mount
  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  // Go back to employee list
  const handleBack = () => {
    navigate('/admin/employee-salary-list');
  };

  // Format date to display in DD-MM-YYYY format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  // Calculate total amount
  const getTotalAmount = (): number => {
    return advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  const renderMobileView = () => {
    return (
      <Box>
        {advancePayments.map((payment, index) => (
          <Card key={payment.id} sx={{ mb: 2, p: 2 }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Sr.No</Typography>
                <Typography variant="body1">{index + 1}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body1">{formatDate(payment.date)}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{employee?.name}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Advance Payment</Typography>
                <Typography variant="body1" fontWeight="bold">{payment.amount?.toFixed(1)}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                <IconButton size="small" color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Stack>
          </Card>
        ))}
        
        <Card sx={{ p: 2, bgcolor: '#e3f2fd' }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight="bold">Total Amount</Typography>
            <Typography variant="subtitle1" fontWeight="bold">{getTotalAmount().toFixed(1)}</Typography>
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Card elevation={1} sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <PaymentsIcon color="primary" />
          <Typography variant="h6">
            Employee Advance Salary List
          </Typography>
        </Box>

        <Box p={2}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <MuiLink component={RouterLink} to="/admin/employee-salary-list" underline="hover" color="inherit">
              List Employee Salary
            </MuiLink>
            <Typography color="text.primary">List Advance Employee Salary</Typography>
          </Breadcrumbs>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              size={isMobile ? "small" : "medium"}
              sx={{
                textTransform: 'none'
              }}
            >
              Back to Employee List
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : advancePayments.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">No advance payments found</Typography>
            </Box>
          ) : isMobile ? (
            renderMobileView()
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Sr.No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Advance Payment</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {advancePayments.map((payment, index) => (
                    <TableRow
                      key={payment.id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{employee?.name}</TableCell>
                      <TableCell align="right">{payment.amount?.toFixed(1)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                      Total Amount
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {getTotalAmount().toFixed(1)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default EmployeeAdvancePaymentList; 