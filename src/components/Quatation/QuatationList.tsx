import * as React from 'react';
import { useState, useEffect } from 'react';
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

export default function QuotationList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");

  // Fetch quotations from the API
  const getQuotationList = async () => {
    try {
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
      setRows(formattedRows);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    }
  };

  useEffect(() => {
    getQuotationList();
  }, []);

  const handleDelete = async (id: number) => {
    setSelectedId(id);
    setOpen(true);    
    if (open) {
      try {
        const response = await apiClient.delete(`/api/quotations/${id}`);
        if (response.status >= 200 && response.status < 300) {
          // Refresh the list after deletion
          getQuotationList();
        } else {
          console.error('Failed to delete quotation:', response.statusText);
        }
      } catch (error) {
        console.error('Error deleting quotation:', error);
      }
    }
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
          onClick={() => navigate(`/admin/quatationpdfgenerator/${params.row.id}`)}
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

  const filteredRows = rows.filter((row) => {
    const search = localSearchTerm.toLowerCase();
    return (
      row.customerName.toLowerCase().includes(search) ||
      (row.customerMobile && row.customerMobile.toLowerCase().includes(search)) ||
      (row.vehicleNumber && row.vehicleNumber.toLowerCase().includes(search))
    );
  });

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
          <CustomizedDataGrid columns={columns} rows={filteredRows} />
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}