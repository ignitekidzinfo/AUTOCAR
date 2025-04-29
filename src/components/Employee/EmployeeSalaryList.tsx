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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payments as PaymentsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import apiClient from '../../Services/apiService';

// Interface for employee data
interface EmployeePaymentDTO {
  id: number;
  name: string;
  joiningDate: string;
  salary: number;
  advancePayment?: number;
}

const EmployeeSalaryList: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeePaymentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/employees');
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle adding a new employee
  const handleAddEmployee = () => {
    navigate('/admin/add-employee-salary');
  };

  // Handle adding an advance payment
  const handleAddAdvancePayment = (employeeId: number, employeeName: string) => {
    navigate(`/admin/add-employee-advance/${employeeId}`, { 
      state: { employeeName } 
    });
  };

  // Handle viewing advance payments
  const handleViewAdvancePayments = (employeeId: number) => {
    navigate(`/admin/employee-advance-list/${employeeId}`);
  };

  // Handle editing an employee
  const handleEditEmployee = (employeeId: number) => {
    navigate(`/admin/edit-employee-salary/${employeeId}`);
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

  const renderMobileView = () => {
    return (
      <Box>
        {employees.map((employee, index) => (
          <Card key={employee.id} sx={{ mb: 2, p: 2 }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Sr.No</Typography>
                <Typography variant="body1">{index + 1}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Joining Date</Typography>
                <Typography variant="body1">{formatDate(employee.joiningDate)}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{employee.name}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Salary</Typography>
                <Typography variant="body1">{employee.salary?.toFixed(1)}</Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={1} mt={1}>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Button 
                    variant="contained" 
                    size="small"
                    fullWidth
                    onClick={() => handleAddAdvancePayment(employee.id, employee.name)}
                    sx={{ 
                      bgcolor: '#1a237e',
                      '&:hover': { bgcolor: '#000051' }
                    }}
                  >
                    Add Advance
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    fullWidth
                    onClick={() => handleViewAdvancePayments(employee.id)}
                    sx={{ 
                      bgcolor: '#0277bd', 
                      '&:hover': { bgcolor: '#004c8c' }
                    }}
                  >
                    View Advance
                  </Button>
                </Box>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <IconButton size="small" color="primary" onClick={() => handleEditEmployee(employee.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Stack>
          </Card>
        ))}
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
            Employee Salary List
          </Typography>
        </Box>

        <Box p={2}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <MuiLink component={RouterLink} to="/" underline="hover" color="inherit">
              Home
            </MuiLink>
            <Typography color="text.primary">List Employee Salary</Typography>
          </Breadcrumbs>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddEmployee}
              startIcon={<AddIcon />}
              size={isMobile ? "small" : "medium"}
              sx={{
                textTransform: 'none',
                bgcolor: '#2e7d32',
                '&:hover': { bgcolor: '#1b5e20' }
              }}
            >
              Add New Employee Salary
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
          ) : employees.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">No employees found</Typography>
            </Box>
          ) : isMobile ? (
            renderMobileView()
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Sr.No</TableCell>
                    <TableCell>Joining Date</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Salary</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#f5f5f5'
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(employee.joiningDate)}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.salary?.toFixed(1)}</TableCell>
                      <TableCell>
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleAddAdvancePayment(employee.id, employee.name)}
                            sx={{ 
                              textTransform: 'none',
                              bgcolor: '#1a237e',
                              '&:hover': { bgcolor: '#000051' }
                            }}
                          >
                            Add Advance
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleViewAdvancePayments(employee.id)}
                            sx={{ 
                              textTransform: 'none',
                              bgcolor: '#0277bd', 
                              '&:hover': { bgcolor: '#004c8c' }
                            }}
                          >
                            View Advance
                          </Button>
                          <IconButton size="small" color="primary" onClick={() => handleEditEmployee(employee.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default EmployeeSalaryList; 