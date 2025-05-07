import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { filter } from 'types/SparePart';
import apiClient from 'utils/apiClient';

// Constants for improved performance
const PAGE_SIZE = 25;
const DEBOUNCE_DELAY = 300;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;
const SCROLL_THRESHOLD = 200;
const ERROR_DISPLAY_DURATION = 5000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache
const MEMORY_CACHE_SIZE = 50; // Maximum number of items in memory cache

// In-memory cache for ultra-fast access
const memoryCache: Map<string, {data: any, timestamp: number}> = new Map();

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

interface PaginatedResponse {
  content: Vehicle[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

// Check if data is cached and fresh
function getCachedData<T>(key: string): T | null {
  try {
    // First check memory cache for the fastest performance
    const memoryCached = memoryCache.get(key);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL) {
      return memoryCached.data as T;
    }
    
    // Then check localStorage
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.timestamp && Date.now() - data.timestamp < CACHE_TTL) {
        // Update memory cache for next time
        if (memoryCache.size >= MEMORY_CACHE_SIZE) {
          // Remove oldest item if cache is full
          const oldestKey = memoryCache.keys().next().value;
          if (oldestKey !== undefined) {
            memoryCache.delete(oldestKey);
          }
        }
        memoryCache.set(key, {data, timestamp: Date.now()});
        return data as T;
      }
    }
  } catch (e) {
    console.error('Error reading cache:', e);
    // Cleanup corrupted data
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore any errors during cleanup
    }
  }
  return null;
}

// Save data to both caches
function saveToCache<T>(key: string, data: T): void {
  try {
    // Save to localStorage first (which could fail if data is too large)
    localStorage.setItem(key, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
    
    // Then update memory cache
    if (memoryCache.size >= MEMORY_CACHE_SIZE) {
      // Remove oldest item if cache is full
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey !== undefined) {
        memoryCache.delete(oldestKey);
      }
    }
    memoryCache.set(key, {data, timestamp: Date.now()});
  } catch (e) {
    console.error('Error saving to cache:', e);
    // Try to save a smaller version if data is too large
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        // For vehicle data, we can trim unnecessary fields
        if (typeof data === 'object' && data !== null && 'vehicles' in data) {
          const trimmedData = {
            ...data,
            vehicles: (data as any).vehicles.map((v: Vehicle) => ({
              vehicleRegId: v.vehicleRegId,
              vehicleNumber: v.vehicleNumber,
              customerName: v.customerName,
              customerMobileNumber: v.customerMobileNumber,
              status: v.status,
              date: v.date
            }))
          };
          localStorage.setItem(key, JSON.stringify({
            ...trimmedData,
            timestamp: Date.now()
          }));
        }
      } catch {
        // Ignore any errors during retry
      }
    }
  }
}

// Optimized batch check function - only checks what's absolutely necessary
export async function batchCheckInvoiceStatus(vehicleIds: string[]): Promise<Record<string, boolean>> {
  if (!vehicleIds.length) return {};
  
  // If there's already a check in progress, return empty
  if ((window as any).__batchCheckInProgress) return {};
  
  // Initialize cached results
  const cachedResults: Record<string, boolean> = {};
  let uncheckedIds: string[] = [];
  
  // First check localStorage for cached results
  vehicleIds.forEach(id => {
    const cacheKey = `invoice_${id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached !== null) {
      cachedResults[id] = cached === 'true';
    } else {
      uncheckedIds.push(id);
    }
  });
  
  // Return immediately if all results are cached
  if (!uncheckedIds.length) return cachedResults;
  
  // Limit to first 3 IDs to make faster and avoid errors
  uncheckedIds = uncheckedIds.slice(0, 3);
  
  // Set in-progress flag and record time
  (window as any).__batchCheckInProgress = true;
  
  try {
    // Check each ID individually to avoid batch API issues
    for (const id of uncheckedIds) {
      try {
        // Use proper endpoint for single invoice check
        const response = await apiClient.get(`/api/vehicle-invoices/search/vehicle-reg/${id}`, {
          timeout: 2000
        });
        
        // Process the result
        const hasInvoice = Array.isArray(response.data) && response.data.length > 0;
        cachedResults[id] = hasInvoice;
        
        // Cache the result
        localStorage.setItem(`invoice_${id}`, String(hasInvoice));
        
        // Add a small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Invoice check failed for ID ${id}:`, error);
        // Set default to false on error
        cachedResults[id] = false;
        localStorage.setItem(`invoice_${id}`, 'false');
      }
    }
  } catch (error) {
    console.warn('Invoice checks failed:', error);
  } finally {
    // Reset flag after a delay to prevent immediate re-requests
    setTimeout(() => {
      (window as any).__batchCheckInProgress = false;
    }, 1000);
  }
  
  return cachedResults;
}

// Legacy function for backward compatibility - now with caching and timeout
export async function checkInvoiceStatus(vehicleRegId: string): Promise<boolean> {
  // In-memory cache to avoid repeated calls
  const cacheKey = `invoice_${vehicleRegId}`;
  
  // Check sessionStorage cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) {
    return cached === 'true';
  }
  
  try {
    const response = await apiClient.get(`/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`, {
      timeout: 2000 // Short timeout to prevent blocking UI
    });

    const hasInvoice = Array.isArray(response.data) && response.data.length > 0;
    
    // Cache the result in sessionStorage
    sessionStorage.setItem(cacheKey, hasInvoice.toString());
    
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

  // Core state
  const [rows, setRows] = React.useState<GridRowsProp>([]);
  const [open, setOpen] = React.useState<boolean>(false);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [dateValue, setDateValue] = React.useState<[Date | null, Date | null]>([null, null]);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [textInput, setTextInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [invoiceStatusCache, setInvoiceStatusCache] = useState<Record<string, boolean>>({});

  // Refs
  const loadingRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized function to process vehicle data for display
  const processVehicleData = useCallback((vehicles: Vehicle[], append = false) => {
    if (!vehicles.length) return [];
    
    // Skip invoice status checks on initial load for speed
    return vehicles.map((vehicle: Vehicle, index: number) => ({
      id: append ? rows.length + index + 1 : index + 1,
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
      hasInvoice: false // Set initially to false, update later async
    }));
  }, [rows.length]);
  
  // Separate function to update invoice status asynchronously
  const updateInvoiceStatus = useCallback(async (vehicleIds: string[]) => {
    if (!vehicleIds.length) return;
    
    // Only update if not already updating
    if ((window as any).__updateInProgress) return;
    
    // Debounce and limit to visible vehicles
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        (window as any).__updateInProgress = true;
        
        // Only check first 3 visible vehicles to avoid performance impact
        const visibleIds = vehicleIds.slice(0, 3);
        if (!visibleIds.length) return;
        
        const statuses = await batchCheckInvoiceStatus(visibleIds);
        if (!Object.keys(statuses).length) return;
        
        // Update cache and state efficiently
        setInvoiceStatusCache(prev => ({...prev, ...statuses}));
        
        setRows(currentRows => {
          const hasChanges = currentRows.some(row => 
            row.vehicleRegId && statuses[row.vehicleRegId] !== undefined && 
            row.hasInvoice !== statuses[row.vehicleRegId]
          );
          
          if (!hasChanges) return currentRows;
          
          return currentRows.map(row => {
            if (row.vehicleRegId && statuses[row.vehicleRegId] !== undefined) {
              return {...row, hasInvoice: statuses[row.vehicleRegId]};
            }
            return row;
          });
        });
      } finally {
        (window as any).__updateInProgress = false;
      }
    }, DEBOUNCE_DELAY * 2);
  }, []);
  
  // Fast fetch function - prioritizes speed over completeness
  const fetchVehicles = useCallback(async (pageNumber: number, append = false) => {
    if (loadingRef.current) return;
    
    if (totalPages > 0 && pageNumber >= totalPages) {
      setHasMore(false);
      return;
    }
    
    // Set loading state
    setLoading(true);
    loadingRef.current = true;
    
    try {
      // Check cache first for fast loading
      const cacheKey = `vehicle_data_${listType || 'all'}_${pageNumber}`;
      const cachedData = getCachedData<{
        vehicles: Vehicle[],
        totalElements: number,
        totalPages: number,
        hasMore: boolean,
        timestamp: number
      }>(cacheKey);
      
      // Disable cache for debugging - set to false in production
      const disableCache = false;
      
      if (!disableCache && cachedData && cachedData.vehicles) {
        // Use cached data immediately
        const processedRows = processVehicleData(cachedData.vehicles, append);
        
        setCurrentPage(pageNumber);
        setTotalElements(cachedData.totalElements || 0);
        setTotalPages(cachedData.totalPages || 1);
        setHasMore(cachedData.hasMore);
        
        if (append) {
          setRows(prev => [...prev, ...processedRows]);
        } else {
          setRows(processedRows);
        }
        
        loadingRef.current = false;
        setLoading(false);
        setInitialLoad(false);
        
        // Don't automatically check invoice status after loading cached data
        // This prevents unnecessary API calls
        return;
      }
      
      // Fetch fresh data
      try {
        let data;
        
        if (listType) {
          const statusFilter = listType === 'serviceQueue' 
            ? 'waiting,inprogress' 
            : listType === 'serviceHistory' ? 'complete' : '';
          
          console.log(`Fetching vehicles with status: ${statusFilter}`);
          
          // Use the imported service function instead of direct API call with timestamp
          const res = await GetVehicleByStatus({ status: statusFilter });
          data = res.data;
          console.log('Vehicle data received:', data ? (Array.isArray(data) ? data.length : 'object') : 'none');
        } else {
          console.log(`Fetching all vehicles`);
          
          // Use the imported service function instead of direct API call with timestamp
          const res = await VehicleListData();
          data = res.data;
          console.log('Vehicle data received:', data ? (Array.isArray(data) ? data.length : 'object') : 'none');
        }
        
        // Process array data
        let vehicles: Vehicle[] = [];
        let totalCount = 0;
        let pageCount = 0;
        
        if (Array.isArray(data)) {
          totalCount = data.length;
          pageCount = Math.ceil(totalCount / PAGE_SIZE);
          
          // Apply client-side pagination
          const startIndex = pageNumber * PAGE_SIZE;
          const endIndex = startIndex + PAGE_SIZE;
          vehicles = data.slice(startIndex, endIndex);
        } else if (data?.content && Array.isArray(data.content)) {
          vehicles = data.content;
          totalCount = data.totalElements || vehicles.length;
          pageCount = data.totalPages || 1;
        }
        
        // Calculate if there's more data
        const hasMoreData = pageNumber < pageCount - 1;
        
        // Cache the data using the optimized method
        saveToCache(cacheKey, {
          vehicles,
          totalElements: totalCount,
          totalPages: pageCount,
          hasMore: hasMoreData
        });
        
        // Process and display data
        const processedRows = processVehicleData(vehicles, append);
        
        setCurrentPage(pageNumber);
        setTotalElements(totalCount);
        setTotalPages(pageCount);
        setHasMore(hasMoreData);
        
        if (append) {
          setRows(prev => [...prev, ...processedRows]);
        } else {
          setRows(processedRows);
        }
        
        setError(null);
        
        // Completely disable automatic invoice status checks
        // Let user actions trigger checks instead
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError('Failed to load data. Please try again.');
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoad(false);
    }
  }, [listType, processVehicleData, totalPages]);
  
  // Initial data load
  useEffect(() => {
    // Start loading immediately
    fetchVehicles(0, false);
    
    // Set up scrolling observer
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
          fetchVehicles(currentPage + 1, true);
        }
      },
      {
        root: null,
        rootMargin: `0px 0px ${SCROLL_THRESHOLD}px 0px`,
        threshold: 0.1
      }
    );
    
    observerRef.current = observer;
    
    // Observe the last element if it exists
    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }
    
    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchVehicles, hasMore, currentPage]);
  
  // Optimized action buttons with memoization
  const renderActionButtons = useCallback((params: GridCellParams) => {
    if (!params.row.vehicleRegId) {
      return <CircularProgress size={20} />;
    }
    
    const vehicleId = params.row.vehicleRegId;
    
    const handleNavigation = (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(path);
    };
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        <IconButton
          color="primary"
          size="small"
          onClick={(e) => handleNavigation(e, `/admin/vehicle/edit/${vehicleId}`)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          color="error"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(vehicleId);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          color="info"
          size="small"
          onClick={(e) => handleNavigation(e, `/admin/vehicle/add/servicepart/${vehicleId}`)}
        >
          <BuildIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          color="success"
          size="small"
          onClick={(e) => handleNavigation(e, `/admin/vehicle/view/${vehicleId}`)}
        >
          <PreviewIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          color="secondary"
          size="small"
          onClick={(e) => handleNavigation(e, `/admin/vehicle/view/${vehicleId}`)}
        >
          <Print fontSize="small" />
        </IconButton>
      </Box>
    );
  }, [navigate]);
  
  // Optimized column rendering
  const renderInvoiceStatus = useCallback((params: GridCellParams) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {params.row.hasInvoice ? (
          <Chip
            icon={<CheckCircleIcon fontSize="small" />}
            color="success"
            variant="outlined"
            size="small"
          />
        ) : (
          <Chip
            icon={<CancelIcon fontSize="small" />}
            color="error"
            variant="outlined"
            size="small"
          />
        )}
      </Box>
    );
  }, []);
  
  const renderStatus = useCallback((params: GridCellParams) => {
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
      />
    );
  }, []);
  
  // Memoized columns definition to avoid recreating on each render
  const columns = React.useMemo<GridColDef[]>(() => [
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
  ], [renderStatus, renderInvoiceStatus, renderActionButtons]);
  
  // Client-side filtering
  const filteredRows = React.useMemo(() => {
    const searchTerm = localSearchTerm.toLowerCase();
    if (!searchTerm) return rows;
    
    return rows.filter((row) => (
      (row.vehicleNoName && row.vehicleNoName.toLowerCase().includes(searchTerm)) ||
      (row.customerMobile && row.customerMobile.toLowerCase().includes(searchTerm)) ||
      (row.status && row.status.toLowerCase().includes(searchTerm)) ||
      (row.superwiser && row.superwiser.toLowerCase().includes(searchTerm)) ||
      (row.technician && row.technician.toLowerCase().includes(searchTerm)) ||
      (row.worker && row.worker.toLowerCase().includes(searchTerm))
    ));
  }, [rows, localSearchTerm]);
  
  // Handle search functions
  const handleLocalSearch = useCallback((term: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setLocalSearchTerm(term.toLowerCase());
    }, DEBOUNCE_DELAY);
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    setSelectedId(id);
    setOpen(true);
  }, []);
  
  const handleApiError = useCallback((err: any, customMessage?: string) => {
    console.error("API Error:", err);
    
    let errorMessage = customMessage || 'Failed to load data. Please try again.';
    setError(errorMessage);
    
    setTimeout(() => {
      setError(null);
    }, ERROR_DISPLAY_DURATION);
    
    return errorMessage;
  }, []);
  
  // Optimized search function
  const handleSearch = useCallback(async () => {
    if (isSearching) return;
    
    setIsSearching(true);
    setLoading(true);
    setError(null);
    
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

      if (response && Array.isArray(response)) {
        const processedRows = processVehicleData(response);
        setRows(processedRows);
        setTotalElements(processedRows.length);
        setTotalPages(1);
      } else if (response && typeof response === 'object') {
        // Handle single vehicle result
        const singleVehicle = response as Vehicle;
        
        setRows([{
          id: 1,
          date: singleVehicle.date ?? '',
          vehicleNoName: singleVehicle.vehicleNumber ?? '',
          customerMobile: singleVehicle.customerName
            ? `${singleVehicle.customerName} - ${singleVehicle.customerMobileNumber ?? ''}`
            : '',
          status: singleVehicle.status ?? '',
          advance: singleVehicle.advancePayment ?? 0,
          superwiser: singleVehicle.superwiser ?? '',
          technician: singleVehicle.technician ?? '',
          worker: singleVehicle.worker ?? '',
          kilometer: singleVehicle.kmsDriven ?? 0,
          vehicleRegId: singleVehicle.vehicleRegId,
          hasInvoice: false
        }]);
        setTotalElements(1);
        setTotalPages(1);
        
        // Check invoice status in background
        setTimeout(() => {
          updateInvoiceStatus([singleVehicle.vehicleRegId]);
        }, 500);
      } else {
        setRows([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      handleApiError(error, 'Search could not be completed. Please try again.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [dateValue, handleApiError, isSearching, processVehicleData, selectedType, textInput, updateInvoiceStatus]);
  
  // Loading skeleton for better UX
  const SkeletonLoading = useCallback(() => (
    <Box sx={{ p: 2 }}>
      {[...Array(3)].map((_, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: 'center',
            borderRadius: 2,
            background: theme.palette.background.paper,
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: '15%' }, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
          <Box sx={{ width: { xs: '100%', sm: '25%' }, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
          <Box sx={{ width: { xs: '100%', sm: '20%' }, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
          <Box sx={{ width: { xs: '100%', sm: '40%' }, height: 24, display: 'flex', gap: 1 }}>
            {[...Array(4)].map((_, i) => (
              <Box key={i} sx={{ flex: 1, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }} />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  ), [theme]);

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

          {/* Quick Search Box */}
          <FormControl fullWidth sx={{ mb: 2 }}>
          <OutlinedInput
            size="small"
              placeholder="Quick search in results..."
              onChange={(e) => handleLocalSearch(e.target.value)}
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
                    disabled={isSearching}
                    sx={{ borderRadius: 2 }}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </Grid>
      </Grid>
            </Paper>
          )}

          {error && (
            <Box sx={{ mb: 2 }}>
              <Alert 
                severity="error" 
                sx={{ borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Box>
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
            {initialLoad ? (
              <SkeletonLoading />
            ) : (
              <>
                <CustomizedDataGrid 
                  columns={columns} 
                  rows={filteredRows}
                  autoHeight={false}
                  checkboxSelection={false}
                  disableVirtualization={false}
                  disableRowSelectionOnClick
                  keepNonExistentRowsSelected={false}
                />
                
                {loading && !initialLoad && !isSearching && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  p: 2, 
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}>
                  <CircularProgress size={24} thickness={5} sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading more vehicles...
                  </Typography>
                </Box>
                )}
              </>
            )}
            
            {/* Intersection observer target element */}
            <div ref={lastElementRef} style={{ height: 10, width: '100%' }} />
          </Box>
          
          {/* Status footer */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            mt: 2,
            p: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              {isSearching 
                ? `Showing ${filteredRows.length} search results` 
                : loading && !initialLoad
                  ? `Loading ${rows.length} of ${totalElements} vehicles...`
                  : `Showing ${rows.length} of ${totalElements} vehicles${!hasMore ? ' (all loaded)' : ''}`
              }
            </Typography>
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