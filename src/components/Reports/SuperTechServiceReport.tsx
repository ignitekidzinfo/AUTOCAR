// SuperTechServiceReport.tsx
import React, { useState } from 'react';
import {
  FormControl,
  Stack,
  Button,
  TextField,
  Typography,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import Copyright from 'internals/components/Copyright';
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import apiClient from 'Services/apiService';

// Add print styles to hide elements when printing
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #print-container, #print-container * {
      visibility: visible;
    }
    #print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
    }
    #print-header {
      display: block !important;
      visibility: visible;
      text-align: center;
      margin-bottom: 20px;
    }
    #print-header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    #print-header p {
      font-size: 14px;
      margin-bottom: 20px;
    }
    .print-hide {
      display: none !important;
    }
    .MuiDataGrid-root, .MuiDataGrid-root * {
      visibility: visible;
    }
    .MuiDataGrid-columnHeaders {
      font-weight: bold;
      background-color: #f5f5f5;
    }
    .MuiDataGrid-cell {
      border: 1px solid #ddd !important;
      padding: 8px !important;
    }
    .MuiDataGrid-columnHeader {
      border: 1px solid #ddd !important;
      padding: 8px !important;
    }
    .MuiDataGrid-footerContainer, 
    .MuiDataGrid-columnSeparator, 
    .MuiDataGrid-menuIcon, 
    .MuiDataGrid-iconButtonContainer, 
    .MuiDataGrid-sortIcon,
    .MuiDataGrid-toolbarContainer {
      display: none !important;
    }
    .action-column {
      display: none !important;
    }
  }
`;

interface ReportRow {
  id: number;
  date: string;
  vehNoAndName: string;
  suprwisr: string;
  technician: string;
  worker: string;
  total: number;
  status: string;
}

const SuperTechServiceReport: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [technician, setTechnician] = useState('');
  const [worker, setWorker] = useState('');
  const [rows, setRows] = useState<GridRowsProp>([]);
  const navigate = useNavigate();

  // Fetch registrations + invoice totals
  const fetchServiceDetails = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both dates');
      return;
    }

    try {
      // 1) get vehicle regs
      const regRes = await apiClient.get(
        '/vehicle-reg/getBySuperwiserAndWorkerAndTechnician',
        { params: { startDate: fromDate, endDate: toDate, superwiser: supervisor, technician, worker } }
      );
      const regs: any[] = regRes.data.data || [];

      // 2) for each reg, fetch its invoices and sum totalAmount
      const enriched: ReportRow[] = await Promise.all(
        regs.map(async (d: any) => {
          const invRes = await apiClient.get(
            `/api/vehicle-invoices/search/vehicle-reg/${d.vehicleRegId}`
          );
          const invoices: any[] = invRes.data.data || invRes.data || [];

          const sumTotal = invoices.reduce(
            (acc, inv) => acc + (Number(inv.totalAmount) || 0),
            0
          );

          return {
            id:            d.vehicleRegId,
            date:          d.date,
            vehNoAndName:  `${d.vehicleNumber} ‑ ${d.customerName}`,
            suprwisr:      d.superwiser,
            technician:    d.technician,
            worker:        d.worker,
            total:         sumTotal,
            status:        d.status,
          };
        })
      );

      setRows(enriched);
    } catch (err) {
      console.error('Error fetching service details:', err);
      alert('Failed to load data');
    }
  };

  // Print a single invoice PDF
  const handlePrintRow = async (vehicleRegId: number) => {
    try {
      const invRes = await apiClient.get(
        `/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`
      );
      const invoices: any[] = invRes.data.data || invRes.data || [];
      if (!invoices.length) {
        alert('No invoices found for this vehicle');
        return;
      }
      // open PDF for the first invoice
      const invoiceNumber = invoices[0].invoiceNumber;
      const url = `${window.location.origin}/admin/supertechservicereportPdf?invoiceNumber=${invoiceNumber}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error loading invoice for PDF:', err);
      alert('Could not load invoice PDF');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id',           headerName: 'Id',             flex: 1, minWidth: 70 },
    { field: 'date',         headerName: 'Date',           flex: 1, minWidth: 120 },
    { field: 'vehNoAndName', headerName: 'Veh No & Name', flex: 2, minWidth: 200 },
    { field: 'suprwisr',     headerName: 'Suprwisr',      flex: 1, minWidth: 130 },
    { field: 'technician',   headerName: 'Technician',    flex: 1, minWidth: 130 },
    { field: 'worker',       headerName: 'Worker',        flex: 1, minWidth: 130 },
    { field: 'total',        headerName: 'Total',         flex: 1, minWidth: 120 },
    { field: 'status',       headerName: 'Status',        flex: 1, minWidth: 120 },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      minWidth: 100,
      sortable: false,
      filterable: false,
      cellClassName: 'action-column',
      headerClassName: 'action-column',
      renderCell: (params: GridCellParams) => (
        <IconButton
          color="secondary"
          onClick={() => handlePrintRow(params.row.id as number)}
        >
          <Print />
        </IconButton>
      ),
    },
  ];

  const handlePrintAll = () => window.print();

  // Format dates for display
  const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : '';
  const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : '';

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      {/* Add print styles */}
      <style>{printStyles}</style>
      
      {/* Screen title - hidden when printing */}
      <Typography variant="h4" gutterBottom className="print-hide">
        Service Details
      </Typography>

      {/* Date pickers + Search - hidden when printing */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} className="print-hide">
        <FormControl sx={{ flexGrow: 1 }}>
          <TextField
            type="date"
            label="From Date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </FormControl>
        <FormControl sx={{ flexGrow: 1 }}>
          <TextField
            type="date"
            label="To Date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </FormControl>
        <Button variant="contained" color="primary" onClick={fetchServiceDetails}>
          Search
        </Button>
      </Stack>

      {/* Supervisor / Technician / Worker filters - hidden when printing */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} className="print-hide">
        <TextField
          label="Search Supervisor"
          variant="outlined"
          fullWidth
          value={supervisor}
          onChange={e => setSupervisor(e.target.value)}
        />
        <TextField
          label="Search Technician"
          variant="outlined"
          fullWidth
          value={technician}
          onChange={e => setTechnician(e.target.value)}
        />
        <TextField
          label="Search Worker"
          variant="outlined"
          fullWidth
          value={worker}
          onChange={e => setWorker(e.target.value)}
        />
      </Stack>

      <Divider sx={{ mb: 2 }} className="print-hide" />

      {/* Main container for printing */}
      <div id="print-container">
        {/* Print header */}
        <div id="print-header" style={{ display: 'none' }}>
          <h1>Monthly Service Report</h1>
          {fromDate && toDate && (
            <p>From {formattedFromDate} To {formattedToDate}</p>
          )}
        </div>

        {/* DataGrid */}
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <CustomizedDataGrid columns={columns} rows={rows} />
          </Grid>
        </Grid>
      </div>

      {/* Print All button - hidden when printing */}
      <div style={{ marginTop: '20px', textAlign: 'center' }} className="print-hide">
        <button
          style={{
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            backgroundColor: '#60B5FF',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#AFDDFF')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#60B5FF')}
          onClick={handlePrintAll}
        >
          Print All
        </button>
      </div>

      <Copyright sx={{ my: 4 }} className="print-hide" />
    </Box>
  );
};

export default SuperTechServiceReport;
