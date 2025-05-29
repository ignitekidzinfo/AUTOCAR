import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import Copyright from 'internals/components/Copyright';
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import { Print } from '@mui/icons-material';
import apiClient from 'Services/apiService';

interface Quotation {
  id: number;
  quotationNumber: string | null;
  quotationDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string | null;
  vehicleNumber: string | null;
  customerEmail: string | null;
  partLines: any[];
  labourLines: any[];
}

// Cache implementation
const CACHE_KEY = 'quotations_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export default function QuotationList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotations from the API with caching
  const getQuotationList = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if it's not expired
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setRows(data);
            setLoading(false);
            return;
          }
        }
      }

      const response = await apiClient.get('/api/quotations');
      const data: Quotation[] = response.data;
      const formattedRows = data.map((quotation) => ({
        id: quotation.id,
        quotationDate: quotation.quotationDate,
        customerName: quotation.customerName,
        customerAddress: quotation.customerAddress,
        customerMobile: quotation.customerMobile ?? '',
        vehicleNumber: quotation.vehicleNumber ?? '',
      }));
      
      // Update state and cache the data
      setRows(formattedRows);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: formattedRows,
        timestamp: Date.now()
      }));
      setError(null);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getQuotationList();
  }, [getQuotationList]);

  const handleDelete = async (id: number) => {
    try {
    setSelectedId(id);
    setOpen(true);    
      
    if (open) {
        const response = await apiClient.delete(`/api/quotations/${id}`);
        if (response.status >= 200 && response.status < 300) {
          // Refresh the list after deletion
          getQuotationList(true);
        } else {
          console.error('Failed to delete quotation:', response.statusText);
          setError('Failed to delete quotation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      setError('Failed to delete quotation. Please try again.');
    }
  };

  const handlePrint = (id: number) => {
    // Navigate to the QuatationPDFGeneration component with the correct ID
    navigate(`/admin/quotation/pdf/${id}`);
  };

  const renderActionButtons = (params: GridCellParams) => {
    return (
      <>
        <IconButton
          color="primary"
          onClick={() => navigate(`/admin/quotation/edit/${params.row.id}`)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="secondary"
          onClick={() => handleDelete(params.row.id)}
        >
          <DeleteIcon />
        </IconButton>
        <IconButton
          color="secondary"
          onClick={() => handlePrint(params.row.id)}
        >
          <Print />
        </IconButton>
      </>
    );
  };

  const columns: GridColDef[] = [
    { field: 'quotationDate', headerName: 'Quotation Date', flex: 1, minWidth: 150 },
    { field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 150 },
    { field: 'customerMobile', headerName: 'Customer Mobile', flex: 1, minWidth: 150 },
    { field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1, minWidth: 150 },
    { field: 'Action', headerName: 'Action', flex: 1, minWidth: 150, renderCell: renderActionButtons },
  ];

  // Memoize filtered rows for better performance
  const filteredRows = useMemo(() => {
    const search = localSearchTerm.toLowerCase();
    return rows.filter((row) => (
      row.customerName.toLowerCase().includes(search) ||
      (row.customerMobile && row.customerMobile.toLowerCase().includes(search)) ||
      (row.vehicleNumber && row.vehicleNumber.toLowerCase().includes(search))
    ));
  }, [rows, localSearchTerm]);

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h6">
          Quotation List
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/admin/quatation')}>
          Add Quotation
        </Button>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <OutlinedInput
            size="small"
            placeholder="Search in results..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start" sx={{ color: 'text.primary' }}>
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
          />
        </FormControl>
      </Box>

      <Grid container spacing={1} columns={12}>
        <Grid item xs={12}>
          {loading ? (
            <Box sx={{ width: '100%' }}>
              <Skeleton variant="rectangular" width="100%" height={400} />
            </Box>
          ) : (
          <CustomizedDataGrid columns={columns} rows={filteredRows} />
          )}
        </Grid>
      </Grid>
      
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
      
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}