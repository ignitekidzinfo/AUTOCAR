import React, { useEffect, useState, useCallback } from 'react';
import {
    Container,
    Stack,
    Typography,
    Button,
    Grid,
    Paper,
    Divider,
    CircularProgress,
    Box,
    Snackbar,
    Alert,
    TextField,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import apiClient from 'Services/apiService';

// Cache key for quotation data
const CACHE_KEY_PREFIX = 'quotation_edit_';

interface PartLine {
    id: number;
    lineNo: number;
    partName: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmt: number;
    finalAmount: number;
}

interface LabourLine {
    id: number;
    lineNo: number;
    name: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmt: number;
    finalAmount: number;
}

interface Quotation {
    id: number;
    quotationNumber: string | null;
    quotationDate: string;
    customerName: string;
    customerAddress: string;
    customerMobile: string;
    vehicleNumber: string;
    customerEmail: string;
    partLines: PartLine[];
    labourLines: LabourLine[];
}

const QuotationEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [formData, setFormData] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Prefetch data from cache if available
    useEffect(() => {
        const cachedData = localStorage.getItem(`${CACHE_KEY_PREFIX}${id}`);
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                setQuotation(parsedData);
                setFormData(parsedData);
                setLoading(false);
            } catch (e) {
                console.error('Error parsing cached data:', e);
            }
        }
    }, [id]);

    // Fetch data from API
    useEffect(() => {
        const fetchQuotation = async () => {
            if (!loading && formData) return; // Skip if already loaded from cache
            
            setLoading(true);
            try {
                const response = await apiClient.get(`/api/quotations/${id}`);
                const data: Quotation = response.data;
                setQuotation(data);
                setFormData(data);
                setError(null);
                
                // Cache the data for future use
                localStorage.setItem(`${CACHE_KEY_PREFIX}${id}`, JSON.stringify(data));
            } catch (error) {
                console.error('Error fetching quotation:', error);
                setError('Failed to load quotation data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchQuotation();
    }, [id, loading, formData]);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = event.target as { name: string; value: string };
        if (formData) {
            setFormData(prev => prev ? { ...prev, [name]: value } : null);
        }
    }, [formData]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (formData) {
            setSaving(true);
            const updates = {
                quotationDate: formData.quotationDate,
                vehicleNumber: formData.vehicleNumber,
                customerName: formData.customerName,
                customerMobile: formData.customerMobile,
                customerEmail: formData.customerEmail,
                customerAddress: formData.customerAddress,
            };

            try {
                const response = await apiClient.patch(`/api/quotations/${id}`, updates);

                if (response.status >= 200 && response.status < 300) {
                    setSuccess('Quotation updated successfully!');
                    // Update the quotation state and cache
                    const updatedQuotation = {...quotation!, ...updates};
                    setQuotation(updatedQuotation);
                    localStorage.setItem(`${CACHE_KEY_PREFIX}${id}`, JSON.stringify(updatedQuotation));
                } else {
                    setError('Failed to update quotation.');
                }
            } catch (error) {
                console.error('Error updating quotation:', error);
                setError('Failed to update quotation. Please try again.');
            } finally {
                setSaving(false);
            }
        }
    };

    // Show minimal loading indicator
    if (loading && !formData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (!formData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <Typography color="error">Failed to load quotation data. Please try again.</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Paper elevation={3} sx={{ p: 4, mt: 3, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h5" fontWeight="500">
                        Edit Quotation #{formData.quotationNumber}
                    </Typography>
                    <Box>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            onClick={() => navigate(-1)}
                            sx={{ mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        {/* Field order matches the image: Quotation Date, Vehicle No, Customer Name, Mobile No, Email ID, Address */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="quotationDate"
                                name="quotationDate"
                                label="Quotation Date*"
                                type="date"
                                value={formData.quotationDate || ""}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton edge="end">
                                                <CalendarTodayIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="vehicleNumber"
                                name="vehicleNumber"
                                label="Vehicle No*"
                                value={formData.vehicleNumber || ""}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="customerName"
                                name="customerName"
                                label="Customer Name*"
                                value={formData.customerName || ""}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="customerMobile"
                                name="customerMobile"
                                label="Mobile No*"
                                value={formData.customerMobile || ""}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="customerEmail"
                                name="customerEmail"
                                label="Email Id"
                                type="email"
                                value={formData.customerEmail || ""}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="customerAddress"
                                name="customerAddress"
                                label="Customer Address*"
                                value={formData.customerAddress || ""}
                                onChange={handleChange}
                                required
                                variant="outlined"
                                size="small"
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar 
                open={!!success} 
                autoHideDuration={3000} 
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default QuotationEdit;