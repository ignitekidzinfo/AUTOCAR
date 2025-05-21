import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Box, Typography, Paper, Stack, Button, IconButton, TextField, 
  InputAdornment, FormControl, InputLabel, Select, MenuItem, 
  Chip, CircularProgress, useTheme, Tooltip, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import PreviewIcon from '@mui/icons-material/Preview';
import { Print, FilterListOutlined, Add as AddIcon } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import direct services instead of store
import { VehicleListData, GetVehicleByStatus } from 'Services/vehicleService';
import VirtualizedVehicleList from './VirtualizedVehicleList';
import VehicleDeleteModal from './VehicleDeleteModal';
import { debounce } from 'lodash';
import { filter } from 'types/SparePart';
import apiClient from 'Services/apiService';

// Constants
const DEBOUNCE_DELAY = 300;

// Vehicle interface
interface Vehicle {
  vehicleRegId: string;
  vehicleNumber?: string;
  vehicleNoName?: string;
  customerName?: string;
  customerMobile?: string;
  customerMobileNumber?: string;
  advancePayment?: number;
  kmsDriven?: number;
  kilometer?: number;
  superwiser?: string;
  technician?: string;
  worker?: string;
  status?: string;
  date?: string;
  hasInvoice?: boolean;
}

const OptimizedVehicleList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Local state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [status, setStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  
  // UI state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Fetch vehicles
  const fetchVehicles = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      
      if (status) {
        const filterObj: filter = { status };
        data = await GetVehicleByStatus(filterObj);
      } else {
        data = await VehicleListData();
      }
      
      setVehicles(data);
      applyFilters(data, searchQuery, status, dateRange);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
      setIsLoading(false);
    }
  }, [status, searchQuery, dateRange]);
  
  // Apply filters
  const applyFilters = useCallback((
    data: Vehicle[], 
    query: string, 
    statusFilter: string | null, 
    dateRangeFilter: [Date | null, Date | null]
  ) => {
    let result = [...data];
    
    // Filter by search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      result = result.filter(v => 
        (v.vehicleNumber?.toLowerCase().includes(lowercaseQuery)) || 
        (v.vehicleNoName?.toLowerCase().includes(lowercaseQuery)) ||
        (v.customerName?.toLowerCase().includes(lowercaseQuery)) ||
        (v.customerMobile?.toLowerCase().includes(lowercaseQuery)) ||
        (v.customerMobileNumber?.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter(v => v.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Filter by date range
    if (dateRangeFilter[0] && dateRangeFilter[1]) {
      const startDate = dateRangeFilter[0].getTime();
      const endDate = dateRangeFilter[1].getTime();
      
      result = result.filter(v => {
        if (!v.date) return false;
        const vehicleDate = new Date(v.date).getTime();
        return vehicleDate >= startDate && vehicleDate <= endDate;
      });
    }
    
    setFilteredVehicles(result);
  }, []);
  
  // Initial load
  useEffect(() => {
    // Always fetch fresh data when component mounts
    fetchVehicles(true);
    
    // Add event listener for when the user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVehicles(true);
      }
    };
    
    // Listen for tab visibility changes to refresh data when returning to the page
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVehicles]);
  
  // Handle search input with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Apply debounced filter
    debounce(() => {
      applyFilters(vehicles, value, status, dateRange);
    }, DEBOUNCE_DELAY)();
  }, [vehicles, status, dateRange, applyFilters]);
  
  // Handle status filter change
  const handleStatusChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    const newStatus = value || null;
    setStatus(newStatus);
    
    // Apply filter immediately
    applyFilters(vehicles, searchQuery, newStatus, dateRange);
  }, [vehicles, searchQuery, dateRange, applyFilters]);
  
  // Handle date range selection
  const handleDateRangeChange = useCallback((dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    
    if (dates[0] && dates[1]) {
      applyFilters(vehicles, searchQuery, status, dates);
    }
  }, [vehicles, searchQuery, status, applyFilters]);
  
  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchVehicles(true);
  }, [fetchVehicles]);
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setStatus(null);
    setSearchQuery('');
    setDateRange([null, null]);
    
    // Clear search input field
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    
    // Reset to all vehicles
    setFilteredVehicles(vehicles);
  }, [vehicles]);
  
  // Navigation handlers
  const handleAdd = useCallback(() => {
    navigate('/admin/vehicle/add');
  }, [navigate]);
  
  const handleEdit = useCallback((id: string) => {
    navigate(`/admin/vehicle/edit/${id}`);
  }, [navigate]);
  
  const handleService = useCallback((id: string) => {
    navigate(`/admin/vehicle/service/${id}`);
  }, [navigate]);
  
  const handleDetails = useCallback((id: string) => {
    navigate(`/admin/vehicle/view/${id}`);
  }, [navigate]);
  
  const handlePrint = useCallback((id: string) => {
    navigate(`/admin/vehicle/print/${id}`);
  }, [navigate]);
  
  // Delete handlers
  const handleDeleteClick = useCallback((id: string) => {
    setVehicleToDelete(id);
    setDeleteModalOpen(true);
  }, []);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (vehicleToDelete) {
      try {
        // Delete from API
        await apiClient.delete(`/vehicle-reg/delete?vehicleRegId=${vehicleToDelete}`);
        
        // Update local state
        setVehicles(prev => prev.filter(v => v.vehicleRegId !== vehicleToDelete));
        setFilteredVehicles(prev => prev.filter(v => v.vehicleRegId !== vehicleToDelete));
        
        setDeleteModalOpen(false);
        setVehicleToDelete(null);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        setError('Failed to delete vehicle. Please try again.');
      }
    }
  }, [vehicleToDelete]);
  
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setVehicleToDelete(null);
  }, []);
  
  // Memoize status options
  const statusOptions = useMemo(() => [
    { value: 'WAITING', label: 'Waiting' },
    { value: 'INPROGRESS', label: 'In Progress' },
    { value: 'COMPLETE', label: 'Complete' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ], []);
  
  // Filter toggle
  const toggleFilter = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);
  
  return (
    <Box sx={{ p: 2, maxWidth: '100%' }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 2,
          bgcolor: 'background.paper' 
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          mb={2}
        >
          <Typography variant="h5" component="h1" fontWeight="bold">
            Vehicle List
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size="small"
            >
              Refresh
            </Button>
            
            <Button
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAdd}
              color="primary"
              size="small"
            >
              Add Vehicle
            </Button>
          </Stack>
        </Stack>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          mb={2}
        >
          <TextField
            inputRef={searchInputRef}
            label="Search Vehicles"
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            variant={isFilterOpen ? "contained" : "outlined"}
            startIcon={<FilterListOutlined />}
            onClick={toggleFilter}
            size="small"
            sx={{ minWidth: 120 }}
          >
            Filters
          </Button>
        </Stack>
        
        {isFilterOpen && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: alpha(theme.palette.primary.light, 0.08),
              borderRadius: 1,
            }}
          >
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems="center"
            >
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  value={status || ''}
                  onChange={handleStatusChange as any}
                  label="Status"
                  displayEmpty
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ minWidth: 250 }}>
                <ReactDatePicker
                  selected={dateRange[0]}
                  onChange={handleDateRangeChange}
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  selectsRange
                  isClearable
                  placeholderText="Select date range"
                  className="date-picker-input"
                  customInput={
                    <TextField
                      variant="outlined"
                      label="Date Range"
                      size="small"
                      fullWidth
                    />
                  }
                />
              </Box>
              
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleClearFilters}
                size="small"
              >
                Clear Filters
              </Button>
            </Stack>
          </Paper>
        )}
      </Paper>
      
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
        <VirtualizedVehicleList
          rows={filteredVehicles}
          loading={isLoading}
          onEditClick={handleEdit}
          onDeleteClick={handleDeleteClick}
          onDetailsClick={handleDetails}
          onServiceClick={handleService}
          onPrintClick={handlePrint}
          isFiltered={!!status || searchQuery !== '' || 
            (dateRange[0] !== null && dateRange[1] !== null)}
        />
      </Box>
      
      <VehicleDeleteModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        deleteItemId={vehicleToDelete ? parseInt(vehicleToDelete) : undefined}
        onDeleteSuccess={() => {
          setVehicles(prev => prev.filter(v => v.vehicleRegId !== vehicleToDelete));
          setFilteredVehicles(prev => prev.filter(v => v.vehicleRegId !== vehicleToDelete));
        }}
      />
    </Box>
  );
};

export default OptimizedVehicleList; 