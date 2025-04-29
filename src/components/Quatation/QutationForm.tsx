import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../Services/apiService';

interface FormData {
  quotationDate: string;
  vehicleNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerAddress: string;
}

export default function AddNewQuotation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    quotationDate: '',
    vehicleNumber: '',
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    customerAddress: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.quotationDate) {
      newErrors.quotationDate = 'Quotation Date is required';
    }
    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle No is required';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer Name is required';
    }
    if (!formData.customerMobile.trim()) {
      newErrors.customerMobile = 'Mobile No is required';
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    }
    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = 'Customer Address is required';
    }
    if (formData.customerEmail && !/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }
    if (formData.customerMobile && !/^\d{10}$/.test(formData.customerMobile)) {
      newErrors.customerMobile = 'Please enter a valid 10-digit mobile number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const response = await apiClient.post('/api/quotations/add', formData);
        setAlert({ message: 'Quotation saved successfully', severity: 'success' });
        navigate(`/admin/vehicle/add/sparepart/${response.data.id}`);
      } catch (error: any) {
        console.error(error);
        setAlert({
          message: error.response?.data?.message || 'Failed to save quotation',
          severity: 'error'
        });
      }
    }
  };

  const handleReset = () => {
    setFormData({
      quotationDate: '',
      vehicleNumber: '',
      customerName: '',
      customerMobile: '',
      customerEmail: '',
      customerAddress: '',
    });
    setErrors({});
  };

  return (
    <Paper sx={{ width: '100%', p: 3, boxSizing: 'border-box' }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Add New Quotation
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Quotation Date"
            type="date"
            name="quotationDate"
            value={formData.quotationDate}
            onChange={handleChange}
            error={!!errors.quotationDate}
            helperText={errors.quotationDate}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Vehicle No"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            error={!!errors.vehicleNumber}
            helperText={errors.vehicleNumber}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Customer Name"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            error={!!errors.customerName}
            helperText={errors.customerName}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Mobile No"
            name="customerMobile"
            value={formData.customerMobile}
            onChange={handleChange}
            error={!!errors.customerMobile}
            helperText={errors.customerMobile}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email Id"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            error={!!errors.customerEmail}
            helperText={errors.customerEmail}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Customer Address"
            name="customerAddress"
            value={formData.customerAddress}
            onChange={handleChange}
            error={!!errors.customerAddress}
            helperText={errors.customerAddress}
            fullWidth
            required
          />
        </Grid>
      </Grid>
      <Box sx={{ textAlign: 'right', mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mr: 2 }}>
          Save
        </Button>
        <Button variant="outlined" onClick={handleReset}>
          Reset
        </Button>
      </Box>
      {alert && (
        <Snackbar open autoHideDuration={6000} onClose={() => setAlert(null)}>
          <Alert onClose={() => setAlert(null)} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
}
