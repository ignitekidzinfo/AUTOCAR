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
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Tooltip,
  Paper,
  Divider,
  Chip,
  alpha,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import InputAdornment from '@mui/material/InputAdornment';
import {
  GetVehicleByAppointmentID,
  GetVehicleByDateRange,
  GetVehicleByStatus,
  VehicleDataByID,
  VehicleListData,
} from 'Services/vehicleService';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import VehicleDeleteModal from './VehicleDeleteModal';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PreviewIcon from '@mui/icons-material/Preview';
import { Print, FilterListOutlined, Add as AddIcon } from '@mui/icons-material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { filter } from 'types/SparePart';
import { Theme } from '@mui/material/styles';
import apiClient from 'Services/apiService';

interface Vehicle {
  vehicleRegId: string;
  vehicleNumber?: string;         
  customerName?: string;           
  customerMobileNumber?: string;    
  advancePayment?: number;          
  kmsDriven?: number;               
  superwiser?: string;
  technician?: string;
  worker?: string;
  status?: string;
  date?: string;
  hasInvoice?: boolean;
}

export async function checkInvoiceStatus(vehicleRegId: string): Promise<boolean> {
  try {
    console.log(`Checking invoice status for vehicle ${vehicleRegId}...`);
    const response = await apiClient.get(`/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`);
    console.log(`Invoice response for vehicle ${vehicleRegId}:`, response.data);

    const hasInvoice = Array.isArray(response.data) && response.data.length > 0;
    console.log(`Vehicle ${vehicleRegId} has invoice:`, hasInvoice);
    
    return hasInvoice;
  } catch (error) {
    console.error(`Error checking invoice status for vehicle ${vehicleRegId}:`, error);
    return false;
  }
}

export default function VehicleList() {
  const navigate = useNavigate();
  const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));
  const listType = searchParams.get("listType");
  const theme = useTheme();

  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [open, setOpen] = React.useState<boolean>(false);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [dateValue, setDateValue] = React.useState<[Date | null, Date | null]>([null, null]);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [textInput, setTextInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);

  // New local search state for filtering the data grid rows
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setOpen(true);
  };

  // Renders the action buttons in the last column
  function renderActionButtons(params: GridCellParams) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        <Tooltip title="Edit Vehicle">
        <IconButton
          color="primary"
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
            }}
          onClick={() => navigate(`/admin/vehicle/edit/${params.row.vehicleRegId}`)}
        >
            <EditIcon fontSize="small" />
        </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete Vehicle">
        <IconButton
            color="error"
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.2) }
            }}
          onClick={() => handleDelete(params.row.vehicleRegId)}
        >
            <DeleteIcon fontSize="small" />
        </IconButton>
        </Tooltip>
        
        <Tooltip title="Manage Service Parts">
        <IconButton
            color="info"
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette.info.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.2) }
            }}
            onClick={() => navigate(`/admin/vehicle/add/servicepart/${params.row.vehicleRegId}`)}
        >
            <BuildIcon fontSize="small" />
        </IconButton>
        </Tooltip>
        
        <Tooltip title="View Details">
        <IconButton
            color="success"
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.2) }
            }}
          onClick={() => navigate(`/admin/vehicle/view/${params.row.vehicleRegId}`)}
        >
            <PreviewIcon fontSize="small" />
        </IconButton>
        </Tooltip>
        
        <Tooltip title="Print">
        <IconButton
          color="secondary"
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.secondary.main, 0.2) }
            }}
          onClick={() => navigate(`/admin/vehicle/view/${params.row.vehicleRegId}`)}
        >
            <Print fontSize="small" />
        </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Function to render the invoice status column
  function renderInvoiceStatus(params: GridCellParams) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {params.row.hasInvoice ? (
          <Chip
            icon={<CheckCircleIcon fontSize="small" />}
            color="success"
            variant="outlined"
            sx={{ minWidth: 35 }}
          />
        ) : (
          <Chip
            icon={<CancelIcon fontSize="small" />}
            color="error"
            variant="outlined"
            sx={{ minWidth: 35 }}
          />
        )}
      </Box>
    );
  }

  // Function to render status with color-coded chip
  function renderStatus(params: GridCellParams) {
    const status = params.value as string;
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    if (status.toLowerCase() === 'complete') color = 'success';
    else if (status.toLowerCase() === 'inprogress') color = 'warning';
    else if (status.toLowerCase() === 'waiting') color = 'info';
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small" 
        variant="outlined"
        sx={{ minWidth: 90 }}
      />
    );
  }

  // Updated columns with proper TypeScript typing
  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 100 },
    { field: 'vehicleNoName', headerName: 'Vehicle Number/Name', flex: 1, minWidth: 150 },
    { field: 'customerMobile', headerName: 'Customer & Mobile', flex: 1, minWidth: 150 },
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 100, renderCell: renderStatus },
    { 
      field: 'advance', 
      headerName: 'Advance', 
      flex: 1, 
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2">₹{params.row.advance}</Typography>
      )
    },
    { field: 'hasInvoice', headerName: 'Invoice', flex: 1, minWidth: 100, renderCell: renderInvoiceStatus },
    { field: 'superwiser', headerName: 'Supervisor', flex: 1, minWidth: 100 },
    { field: 'technician', headerName: 'Technician', flex: 1, minWidth: 100 },
    { field: 'worker', headerName: 'Worker', flex: 1, minWidth: 100 },
    { 
      field: 'kilometer', 
      headerName: 'Kilometers', 
      flex: 1, 
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.kilometer} km</Typography>
      )
    },
    { field: 'Action', headerName: 'Actions', flex: 1, minWidth: 250, renderCell: renderActionButtons },
  ];

  // Function to check invoice status for all vehicles
  const checkInvoiceStatusForVehicles = async (vehicles: any[]) => {
    const updatedVehicles = [];
    setLoading(true);
    
    for (const vehicle of vehicles) {
      try {
        const hasInvoice = await checkInvoiceStatus(vehicle.vehicleRegId);
        updatedVehicles.push({
          ...vehicle,
          hasInvoice
        });
      } catch (error) {
        console.error(`Error checking invoice for vehicle ${vehicle.vehicleRegId}:`, error);
        updatedVehicles.push({
          ...vehicle,
          hasInvoice: false
        });
      }
    }
    
    setLoading(false);
    return updatedVehicles;
  };

  // Search logic with invoice status check
  const handleSearch = async () => {
    let requestData: filter = {};
    let response;
    try {
      if (selectedType === 'Vehicle ID') {
        requestData = { vehicleRegId: textInput };
        const res = await VehicleDataByID(textInput);
        response = res.data;
      } else if (selectedType === 'Date Range') {
        requestData = {
          startDate: dateValue[0] ? dateValue[0].toISOString().slice(0, 10) : '',
          endDate: dateValue[1] ? dateValue[1].toISOString().slice(0, 10) : ''
        };
        const res = await GetVehicleByDateRange(requestData);
        response = res.data;
      } else if (selectedType === 'Appointment Number') {
        requestData = { appointmentId: textInput };
        const res = await GetVehicleByAppointmentID(requestData);
        response = res.data;
      }

      if (listType) {
        let statusFilter = '';
        if (listType === 'serviceQueue') {
          statusFilter = 'waiting,inprogress';
        } else if (listType === 'serviceHistory') {
          statusFilter = 'complete';
        }
        const res = await GetVehicleByStatus({ status: statusFilter });
        response = res.data;
      }

      if (response && Array.isArray(response)) {
        const formattedRows = response.map((vehicle: Vehicle, index: number) => ({
          id: index + 1,
          date: vehicle.date ?? '',
          vehicleNoName: vehicle.vehicleNumber ?? '',
          customerMobile: vehicle.customerName 
            ? `${vehicle.customerName} - ${vehicle.customerMobileNumber ?? ''}`
            : '',
          status: vehicle.status ?? '',
          advance: vehicle.advancePayment ?? 0,
          superwiser: vehicle.superwiser ?? '',
          technician: vehicle.technician ?? '',
          worker: vehicle.worker ?? '',
          kilometer: vehicle.kmsDriven ?? 0,
          vehicleRegId: vehicle.vehicleRegId,
          hasInvoice: false, // Default value, will be updated
        }));
        
        // Check invoice status for all vehicles
        const rowsWithInvoiceStatus = await checkInvoiceStatusForVehicles(formattedRows);
        setRows(rowsWithInvoiceStatus);
      } else if (response && typeof response === 'object') {
        const singleRow = {
          id: 1,
          date: response.date ?? '',
          vehicleNoName: response.vehicleNumber ?? '',
          customerMobile: response.customerName
            ? `${response.customerName} - ${response.customerMobileNumber ?? ''}`
            : '',
          status: response.status ?? '',
          advance: response.advancePayment ?? 0,
          superwiser: response.superwiser ?? '',
          technician: response.technician ?? '',
          worker: response.worker ?? '',
          kilometer: response.kmsDriven ?? 0,
          vehicleRegId: response.vehicleRegId,
          hasInvoice: false, // Default value, will be updated
        };
        
        // Check invoice status for single vehicle
        const hasInvoice = await checkInvoiceStatus(response.vehicleRegId);
        setRows([{ ...singleRow, hasInvoice }]);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // On mount, load the list with invoice status
  useEffect(() => {
    const getVehicleList = async () => {
      try {
        setLoading(true);
        let data;
        
        if (listType) {
          let statusFilter = '';
          if (listType === 'serviceQueue') {
            statusFilter = 'waiting,inprogress';
          } else if (listType === 'serviceHistory') {
            statusFilter = 'complete';
          }
          const res = await GetVehicleByStatus({ status: statusFilter });
          data = res.data;
        } else {
          const res = await VehicleListData();
          data = res.data;
        }
        
        if (data && Array.isArray(data)) {
          const formattedRows = data.map((vehicle: Vehicle, index: number) => ({
            id: index + 1,
            date: vehicle.date ?? '',
            vehicleNoName: vehicle.vehicleNumber ?? '',
            customerMobile: vehicle.customerName
              ? `${vehicle.customerName} - ${vehicle.customerMobileNumber ?? ''}`
              : '',
            status: vehicle.status ?? '',
            advance: vehicle.advancePayment ?? 0,
            superwiser: vehicle.superwiser ?? '',
            technician: vehicle.technician ?? '',
            worker: vehicle.worker ?? '',
            kilometer: vehicle.kmsDriven ?? 0,
            vehicleRegId: vehicle.vehicleRegId,
            hasInvoice: false, // Default value, will be updated
          }));
          
          // Check invoice status for all vehicles
          const rowsWithInvoiceStatus = await checkInvoiceStatusForVehicles(formattedRows);
          setRows(rowsWithInvoiceStatus);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        setLoading(false);
      }
    };
    getVehicleList();
  }, [listType]);

  // Client-side filtering using the local search term:
  const filteredRows = rows.filter((row) => {
    const search = localSearchTerm.toLowerCase();
    return (
      row.vehicleNoName.toLowerCase().includes(search) ||
      row.customerMobile.toLowerCase().includes(search) ||
      (row.status && row.status.toLowerCase().includes(search)) ||
      (row.superwiser && row.superwiser.toLowerCase().includes(search)) ||
      (row.technician && row.technician.toLowerCase().includes(search)) ||
      (row.worker && row.worker.toLowerCase().includes(search))
    );
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' }, p: 2 }}>
      <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            justifyContent="space-between" 
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
          Vehicle List
        </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {listType === 'serviceQueue' 
                  ? 'Vehicles currently in service queue' 
                  : listType === 'serviceHistory' 
                    ? 'Completed service history'
                    : 'All registered vehicles'}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/vehicle/add')}
              sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[3],
                px: 3
              }}
            >
          Add Vehicle
        </Button>
      </Stack>

          {/* Quick Search Box Above the Data Grid */}
          <FormControl fullWidth sx={{ mb: 2 }}>
          <OutlinedInput
            size="small"
              placeholder="Quick search in results..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            startAdornment={
                <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
              sx={{ 
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.common.white, 0.05)
              }}
          />
        </FormControl>

          {/* Advanced search toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button 
              size="small" 
              startIcon={<FilterListOutlined />}
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              sx={{ borderRadius: 2 }}
            >
              {showAdvancedSearch ? "Hide Advanced Search" : "Show Advanced Search"}
            </Button>
      </Box>

          {/* Advanced search section */}
          {showAdvancedSearch && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                mb: 2
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Search Type</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
                      size="small"
                      sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Vehicle ID">Vehicle ID</MenuItem>
              <MenuItem value="Date Range">Date Range</MenuItem>
              <MenuItem value="Appointment Number">Appointment Number</MenuItem>
            </Select>
          </FormControl>
                </Grid>

          {(selectedType === 'Vehicle ID' || selectedType === 'Appointment Number') && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
              <OutlinedInput
                size="small"
                id="search"
                        placeholder={selectedType === 'Vehicle ID' ? "Enter vehicle ID..." : "Enter appointment number..."}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                startAdornment={
                          <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                }
                        sx={{ borderRadius: 2 }}
              />
            </FormControl>
                  </Grid>
          )}

          {selectedType === 'Date Range' && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <Box sx={{ 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 2,
                        overflow: 'hidden',
                        '& .react-datepicker-wrapper': {
                          width: '100%'
                        },
                        '& input': {
                          width: '100%',
                          p: 1,
                          boxSizing: 'border-box',
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.875rem'
                        }
                      }}>
                <ReactDatePicker
                  selected={dateValue[0]}
                  onChange={(update: [Date | null, Date | null]) => setDateValue(update)}
                  startDate={dateValue[0]}
                  endDate={dateValue[1]}
                  selectsRange
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date range"
                />
                      </Box>
              </FormControl>
            </Grid>
          )}

                <Grid item xs={12} md={3}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={handleSearch}
                    sx={{ borderRadius: 2 }}
                  >
            Search
          </Button>
        </Grid>
      </Grid>
            </Paper>
          )}

          {/* Data grid section */}
          <Box sx={{ 
            position: 'relative',
            height: 'calc(100vh - 350px)',
            minHeight: '400px',
            width: '100%',
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}>
            {loading && (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
                zIndex: 10
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading vehicle data...
                  </Typography>
                </Box>
            </Box>
            )}
            
            <CustomizedDataGrid 
              columns={columns} 
              rows={filteredRows} 
            />
          </Box>
        </CardContent>
      </Card>
      
      <VehicleDeleteModal 
        open={open} 
        onClose={() => setOpen(false)} 
        deleteItemId={Number(selectedId)} 
      />
      
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}