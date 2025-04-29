import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Container,
  TextField,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Card,
  Stack
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import apiClient from '../../Services/apiService';

interface EmployeePaymentDTO {
  name: string;
  joiningDate: string;
  salary: number;
}

const AddEmployeeSalary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [joiningDate, setJoiningDate] = useState<dayjs.Dayjs | null>(null);
  const [salary, setSalary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`/api/employees/${id}`)
        .then(res => {
          setName(res.data.name);
          setJoiningDate(dayjs(res.data.joiningDate));
          setSalary(res.data.salary.toString());
        })
        .catch(() => setError('Failed to load employee data.'))
        .finally(() => setLoading(false));
    } else {
      setName('');
      setJoiningDate(null);
      setSalary('');
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name) {
      setError('Please enter employee name');
      return;
    }
    
    if (!joiningDate) {
      setError('Please select joining date');
      return;
    }
    
    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) {
      setError('Please enter a valid salary amount');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const employeeData: EmployeePaymentDTO = {
      name,
      joiningDate: joiningDate.format('YYYY-MM-DD'),
      salary: Number(salary)
    };
    
    try {
      if (id) {
        await apiClient.patch(`/api/employees/${id}`, { salary: Number(salary) });
        setSuccessMessage('Employee updated successfully!');
      } else {
        await apiClient.post('/api/employees', employeeData);
        setSuccessMessage('Employee added successfully!');
        handleReset();
      }
      setTimeout(() => {
        navigate('/admin/employee-salary-list');
      }, 1500);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setJoiningDate(null);
    setSalary('');
    setError('');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 } }}>
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
            {id ? 'Edit Employee Salary' : 'Add Employee Salary'}
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
            <Typography color="text.primary">{id ? 'Edit Employee Salary' : 'Add Employee Salary'}</Typography>
          </Breadcrumbs>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Joining Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={joiningDate}
                    onChange={(newValue) => setJoiningDate(newValue)}
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
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Name
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Name"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Salary
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Employee Salary"
                  variant="outlined"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  type="number"
                  size="small"
                />
              </Box>
            </Stack>

            <Box
              sx={{
                mt: 4,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' },
                  minWidth: 100
                }}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                sx={{
                  color: '#6c757d',
                  borderColor: '#6c757d',
                  '&:hover': {
                    borderColor: '#5a6268',
                    bgcolor: 'rgba(108, 117, 125, 0.04)'
                  },
                  minWidth: 100
                }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default AddEmployeeSalary; 