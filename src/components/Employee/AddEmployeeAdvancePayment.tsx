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
import { Link as RouterLink, useNavigate, useParams, useLocation } from 'react-router-dom';
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

interface UpdateEmployeePaymentRequest {
  advancePayment: number;
}

interface LocationState {
  employeeName?: string;
}

const AddEmployeeAdvancePayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState;
  const employeeName = state?.employeeName || '';

  const [advanceDate, setAdvanceDate] = useState<dayjs.Dayjs | null>(null);
  const [advancePayment, setAdvancePayment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!advanceDate) {
      setError('Please select advance received date');
      return;
    }
    
    if (!advancePayment || isNaN(Number(advancePayment)) || Number(advancePayment) <= 0) {
      setError('Please enter a valid advance payment amount');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const paymentData: UpdateEmployeePaymentRequest = {
      advancePayment: Number(advancePayment)
    };
    
    try {
      await apiClient.patch(`/api/employees/${id}`, paymentData);
      setSuccessMessage('Advance payment added successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/admin/employee-advance-list/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving advance payment:', err);
      setError('Failed to save advance payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAdvanceDate(null);
    setAdvancePayment('');
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
            Add Employee Salary
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
            <Typography color="text.primary">Add Employee Advance Payment</Typography>
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
                  Advance Received Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={advanceDate}
                    onChange={(newValue) => setAdvanceDate(newValue)}
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
                  placeholder="Employee Name"
                  variant="outlined"
                  value={employeeName}
                  disabled
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Advance Payment
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Advance Payment"
                  variant="outlined"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
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

export default AddEmployeeAdvancePayment; 