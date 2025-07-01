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
  VehicleDataByID,
} from 'Services/vehicleService';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import VehicleDeleteModal from './VehicleDeleteModal';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Print, FilterListOutlined, Add as AddIcon } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { filter } from 'types/SparePart';
import { apiClient } from 'utils/apiClient';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { 
  MemoryCache, 
  cacheManager, 
  PERFORMANCE_CONSTANTS,
  safePerformance 
} from 'utils/performance';

// Constants for improved performance
const PAGE_SIZE = 25;
const DEBOUNCE_DELAY = 300;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;
const SCROLL_THRESHOLD = 200;
const ERROR_DISPLAY_DURATION = 5000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache (instead of disabling entirely)
const MEMORY_CACHE_SIZE = 50; // Maximum number of items in memory cache

// Create a version-based cache key to help with invalidation
let cacheVersion = Date.now();

// Create vehicle-specific cache for better performance
const vehicleCache = new MemoryCache(MEMORY_CACHE_SIZE);

// Declare TypeScript type for the window object extension
declare global {
  interface Window {
    __FORCE_REFRESH_COUNTER: number;
    vehicleDataChanged: boolean;
  }
}

// Initialize global counter if not exists
window.__FORCE_REFRESH_COUNTER = window.__FORCE_REFRESH_COUNTER || 0;

// Flag to track if data has changed
window.vehicleDataChanged = false;

// Global event bus for cross-component communication
document.addEventListener('vehicleDataChange', () => {
  window.__FORCE_REFRESH_COUNTER++;
  window.vehicleDataChanged = true;
  console.log('Global vehicle data change detected, refresh counter:', window.__FORCE_REFRESH_COUNTER);
  // Invalidate cache when data changes
  invalidateCache();
});

// Function to manage vehicle caching
const vehicleCacheManager = {
  get: function<T>(key: string): T | null {
    try {
      // First try memory cache
      const memCached = vehicleCache.getWithExpiry<T>(key, CACHE_TTL);
      if (memCached) {
        console.log(`Cache HIT (memory): ${key}`);
        return memCached;
      }
      
      // Then try localStorage
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // Check timestamp AND version to ensure we're not using stale data
        if (data.timestamp && 
            Date.now() - data.timestamp < CACHE_TTL && 
            data.version === cacheVersion) {
          console.log(`Cache HIT (localStorage): ${key}`);
          // Store in memory for faster future access
          vehicleCache.set(key, data.data);
          return data.data as T;
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
      // Cleanup corrupted data
      try {
        localStorage.removeItem(key);
        vehicleCache.delete(key);
      } catch {}
    }
    console.log(`Cache MISS: ${key}`);
    return null;
  },
  
  set: function<T>(key: string, data: T): void {
    try {
      // Save to memory cache (fast access)
      vehicleCache.set(key, data);
      
      // Save to localStorage (persistence)
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: cacheVersion
      }));
      console.log(`Cached: ${key}`);
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  },
  
  delete: function(key: string): void {
    try {
      localStorage.removeItem(key);
      vehicleCache.delete(key);
    } catch (e) {
      console.error('Error deleting from cache:', e);
    }
  },
  
  clear: function(): void {
    try {
      // Clear memory cache
      vehicleCache.clear();
      
      // Clear localStorage cache for vehicle data
      Object.keys(localStorage)
        .filter(key => key.startsWith('vehicle_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  }
};

// Function to invalidate cache when data changes
function invalidateCache() {
  // Update cache version to immediately invalidate all existing cache entries
  cacheVersion = Date.now();
  
  // Clear cache
  vehicleCacheManager.clear();
  
  // Dispatch global event to notify all components about data change
  document.dispatchEvent(new CustomEvent('vehicleDataChange'));
  
  console.log('Cache invalidated at:', new Date().toISOString());
}

// Function to force refresh of vehicle data
function forceVehicleDataRefresh() {
  // Increment counter to ensure UI sees this as a change
  window.__FORCE_REFRESH_COUNTER++;
  window.vehicleDataChanged = true;
  
  // Force invalidate caches
  invalidateCache();
  
  console.log('Forced vehicle data refresh at:', new Date().toISOString());
  return true;
}

// Direct API call with optional cache
async function fetchFromApi(url: string, skipCache = false): Promise<any> {
  const cacheKey = `vehicle_${url.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Return from cache if available and not skipping cache
  if (!skipCache) {
    const cachedData = vehicleCacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    // Add cache busting parameter if skipping cache
    const requestUrl = skipCache 
      ? `${url}${url.includes('?') ? '&' : '?'}_nocache=${Date.now()}` 
      : url;
    
    console.log(`Fetching from API: ${requestUrl}`);
    const startTime = performance.now();
    
    // Make the actual API call
    const response = await apiClient.get(requestUrl);
    
    const endTime = performance.now();
    console.log(`API response time: ${endTime - startTime}ms`);
    
    // Cache the result if not skipping cache
    if (!skipCache) {
      vehicleCacheManager.set(cacheKey, response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching from API:', error);
    throw error;
  }
}

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

// Add a simple invoice status check function
async function checkInvoiceStatus(vehicleRegId: string): Promise<boolean> {
  const cacheKey = `vehicle_invoice_${vehicleRegId}`;
  
  // Check cache first
  const cachedStatus = vehicleCacheManager.get<boolean>(cacheKey);
  if (cachedStatus !== null) {
    return cachedStatus;
  }
  
  try {
    const response = await apiClient.get(`/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`, {
      timeout: 2000 // Short timeout to prevent blocking UI
    });
    
    const hasInvoice = Array.isArray(response.data) && response.data.length > 0;
    
    // Cache the result
    vehicleCacheManager.set(cacheKey, hasInvoice);
    
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

  // Force rerender on cache invalidation
  const [forceUpdateCounter, setForceUpdateCounter] = useState<number>(0);
  const forceUpdate = useCallback(() => setForceUpdateCounter(c => c + 1), []);

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
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Refs
  const loadingRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rawDataRef = useRef<Vehicle[]>([]);
  const isComponentMountedRef = useRef<boolean>(true);
  const refreshingDataRef = useRef<boolean>(false);
  
  // Add new state for delete operation
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Process vehicle data without any external dependencies
  const processVehicleData = useCallback((vehicles: Vehicle[] | any, append = false) => {
    if (!vehicles || !vehicles.length) {
      console.warn('No vehicles data to process');
      return [];
    }
    
    // Get recently modified vehicles
    let recentlyModified: string[] = [];
    try {
      recentlyModified = JSON.parse(localStorage.getItem('recentVehicleChanges') || '[]');
    } catch (e) {
      // Ignore errors
    }
    
    // Handle different data formats - simplify for speed
    let processableVehicles = vehicles;
    
    // Check if we have a data property that contains the actual vehicles
    if (!Array.isArray(vehicles) && vehicles.data && Array.isArray(vehicles.data)) {
      processableVehicles = vehicles.data;
    }
    
    // Process with optimized mapping, using stable row IDs
    return processableVehicles.map((vehicle: Vehicle, index: number) => {
      const vehicleId = vehicle.vehicleRegId || (append ? `new-${index}` : `row-${index}`);
      const isModified = recentlyModified.includes(vehicleId);
      
      return {
        id: vehicleId,
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
        kilometer: vehicle.kmsDriven ?? '',
        vehicleRegId: vehicle.vehicleRegId,
        hasInvoice: false, // Set initially to false, update later async
        isNew: isModified // Flag for highlighting
      };
    });
  }, []);
  
  // Optimized fetchVehiclesFromApi using the cache
  const fetchVehiclesFromApi = useCallback(async (skipCache = false): Promise<Vehicle[]> => {
    try {
      let endpoint = '/vehicle-reg/getAll';
      
      if (listType) {
        const statusFilter = listType === 'serviceQueue' 
          ? 'waiting,inprogress' 
          : listType === 'serviceHistory' ? 'complete' : '';
          
        endpoint = `/vehicle-reg/GetStatus?status=${statusFilter}`;
      }
      
      // Generate cache key based on endpoint
      const cacheKey = `vehicle_list_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Try to get from cache if not skipping
      if (!skipCache) {
        const cachedVehicles = vehicleCacheManager.get<Vehicle[]>(cacheKey);
        if (cachedVehicles) {
          console.log(`Using cached vehicle data (${cachedVehicles.length} vehicles)`);
          return cachedVehicles;
        }
      }
      
      // Not in cache or skipping cache, fetch from API
      console.log('Fetching vehicles from API...');
      const startTime = performance.now();
      
      const baseUrl = apiClient.defaults.baseURL || '';
      const fullUrl = `${baseUrl}${endpoint}`;
      
      // Make actual API call
      const response = await apiClient.get(endpoint);
      const data = response.data;
      
      const endTime = performance.now();
      console.log(`API fetch completed in ${endTime - startTime}ms`);
      
      // Process the data
      let vehicles: Vehicle[] = [];
      
      if (Array.isArray(data)) {
        vehicles = data;
      } else if (data?.content && Array.isArray(data.content)) {
        vehicles = data.content;
      } else if (data?.data && Array.isArray(data.data)) {
        vehicles = data.data;
      } else if (typeof data === 'object') {
        // Try to extract vehicles from any other format
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val)) as any[][];
        if (possibleArrays.length > 0) {
          vehicles = possibleArrays.reduce<any[]>((a, b) => a.length > b.length ? a : b, []) as Vehicle[];
        }
      }
      
      // If still no vehicles, try to handle as a single vehicle
      if (vehicles.length === 0 && typeof data === 'object' && data.vehicleRegId) {
        vehicles = [data];
      }
      
      // Save to cache if not skipping cache
      if (!skipCache && vehicles.length > 0) {
        vehicleCacheManager.set(cacheKey, vehicles);
      }
      
      console.log(`Fetched ${vehicles.length} vehicles from API`);
      return vehicles;
      
    } catch (error) {
      console.error('Error fetching vehicles from API:', error);
      throw error;
    }
  }, [listType]);

  // Update fetchVehicles to use the optimized cached data fetching
  const fetchVehicles = useCallback(async (pageNumber: number, append = false, skipCache = false) => {
    if (loadingRef.current || !isComponentMountedRef.current) return;
    
    // Set loading state
    loadingRef.current = true;
    setLoading(true);
    
    try {
      console.log(`Fetching vehicles, page ${pageNumber}, skipCache: ${skipCache}`);
      const startTime = performance.now();
      
      // Fetch data with optional cache skipping
      const vehicles = await fetchVehiclesFromApi(skipCache);
      
      const endTime = performance.now();
      console.log(`Total fetch time: ${endTime - startTime}ms`);
      
      if (!isComponentMountedRef.current) return;
      
      // Store raw data for comparison
      rawDataRef.current = [...vehicles];
      
      // Calculate pagination
      const totalCount = vehicles.length;
      const pageCount = Math.ceil(totalCount / PAGE_SIZE);
      const hasMoreData = pageNumber < pageCount - 1;
      
      // Get page data
      const startIndex = pageNumber * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageVehicles = append ? vehicles : vehicles.slice(startIndex, endIndex);
      
      // Process data for display
      const processedRows = processVehicleData(pageVehicles, append);
      
      // Update all state
      setCurrentPage(pageNumber);
      setTotalElements(totalCount);
      setTotalPages(pageCount);
      setHasMore(hasMoreData);
      setLastUpdateTime(Date.now());
      
      // Update rows with fresh data
      if (append) {
        setRows(prev => [...prev, ...processedRows]);
      } else {
        setRows(processedRows);
      }
      
      setError(null);
      
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (isComponentMountedRef.current) {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      if (isComponentMountedRef.current) {
        loadingRef.current = false;
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [fetchVehiclesFromApi, processVehicleData]);

  // Check for data changes - reduced frequency to minimize API calls
  const checkForDataChanges = useCallback(async () => {
    if (loadingRef.current || refreshingDataRef.current || !isComponentMountedRef.current) return;
    
    refreshingDataRef.current = true;
    
    try {
      // Try from cache first
      const cacheCheckResult = window.vehicleDataChanged;
      
      if (cacheCheckResult) {
        // Cache indicates data has changed
        console.log('Cache indicates vehicle data has changed, refreshing...');
        window.vehicleDataChanged = false; // Reset the flag
        fetchVehicles(0, false, true); // Skip cache to ensure fresh data
        return;
      }
      
      // Only make a lightweight API check if necessary (once per minute)
      const lastCheckTime = parseInt(sessionStorage.getItem('lastVehicleDataCheck') || '0', 10);
      const now = Date.now();
      const checkInterval = 60 * 1000; // 1 minute
      
      if (now - lastCheckTime < checkInterval) {
        refreshingDataRef.current = false;
        return;
      }
      
      // Time to check the API
      sessionStorage.setItem('lastVehicleDataCheck', now.toString());
      
      // Fast API check that just gets count or timestamps
      const checkUrl = '/vehicle-reg/count'; // Assuming there's a lightweight endpoint
      let hasChanges = false;
      
      try {
        const countResponse = await apiClient.get(checkUrl);
        const currentCount = rawDataRef.current.length;
        const apiCount = countResponse.data;
        
        if (apiCount !== currentCount) {
          console.log('Vehicle count changed from API check, updating data');
          hasChanges = true;
        }
      } catch (e) {
        // If count endpoint doesn't exist, fall back to comparing first few items
        const sampleVehicles = await fetchVehiclesFromApi(true); // Skip cache
        
        if (sampleVehicles.length !== rawDataRef.current.length) {
          hasChanges = true;
        } else if (sampleVehicles.length > 0 && rawDataRef.current.length > 0) {
          // Check first vehicle's data
          const firstNew = sampleVehicles[0];
          const firstCurrent = rawDataRef.current[0];
          
          if (firstNew.vehicleRegId !== firstCurrent.vehicleRegId) {
            hasChanges = true;
          }
        }
      }
      
      // If we found changes, update the data
      if (hasChanges) {
        console.log('Vehicle data changed from API check, refreshing...');
        window.vehicleDataChanged = true;
        fetchVehicles(0, false, true); // Skip cache for fresh data
      }
      
    } catch (error) {
      console.error('Error checking for data changes:', error);
    } finally {
      refreshingDataRef.current = false;
    }
  }, [fetchVehicles, fetchVehiclesFromApi]);
  
  // Watch for global data changes
  useEffect(() => {
    const handleGlobalDataChange = () => {
      if (isComponentMountedRef.current && !refreshingDataRef.current) {
        console.log('Global data change detected, refreshing vehicle list');
        fetchVehicles(0, false, true); // Skip cache to ensure fresh data
        forceUpdate();
      }
    };
    
    // Listen for the custom event
    document.addEventListener('vehicleDataChange', handleGlobalDataChange);
    
    // Also set up a checker to see if window.__FORCE_REFRESH_COUNTER changed
    // This check runs less frequently to reduce network traffic
    const checkWindowRefreshCounter = () => {
      if (window.vehicleDataChanged) {
        window.vehicleDataChanged = false;
        handleGlobalDataChange();
      }
    };
    
    // Reduced frequency to minimize traffic
    const counterInterval = setInterval(checkWindowRefreshCounter, 10000);
    
    return () => {
      document.removeEventListener('vehicleDataChange', handleGlobalDataChange);
      clearInterval(counterInterval);
    };
  }, [fetchVehicles, forceUpdate]);

  // Regular auto-refresh - REMOVED to reduce network traffic
  useEffect(() => {
    // Auto-refresh has been removed
    // This prevents continuous polling and conserves network resources
    // Data will refresh only when:
    // 1. The component mounts
    // 2. A manual refresh is triggered
    // 3. Navigation back to this page occurs
    
    // Clean up any existing timer just in case
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, []);
  
  // Component lifecycle
  useEffect(() => {
    isComponentMountedRef.current = true;
    const perfMark = `vehicle-list-mount-${Date.now()}`;
    
    // Create the performance mark using the safe utility
    safePerformance.mark(perfMark);
    
    // Check if we're returning from edit/add and need to refresh
    const needsRefresh = localStorage.getItem('needsRefreshOnReturn') === 'true';
    if (needsRefresh) {
      // Clear the flag
      localStorage.removeItem('needsRefreshOnReturn');
      console.log('Returning from edit/add - forcing fresh data fetch');
      // Force immediate refresh
      forceVehicleDataRefresh();
      // Fetch fresh data with delay to ensure server has processed changes
      setTimeout(() => {
        if (isComponentMountedRef.current) {
          fetchVehicles(0, false, true); // Skip cache
        }
      }, 500);
    } else {
      // Try to load from cache first for instant rendering
      const cachedData = vehicleCacheManager.get<Vehicle[]>('vehicle_list_current');
      
      if (cachedData && cachedData.length > 0) {
        console.log(`Loaded ${cachedData.length} vehicles from cache for initial render`);
        rawDataRef.current = [...cachedData];
        
        // Process cached data for display
        const processedRows = processVehicleData(cachedData.slice(0, PAGE_SIZE));
        setRows(processedRows);
        setTotalElements(cachedData.length);
        setTotalPages(Math.ceil(cachedData.length / PAGE_SIZE));
        setHasMore(cachedData.length > PAGE_SIZE);
        setInitialLoad(false);
        
        // After showing cached data, refresh in background
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            fetchVehicles(0, false, false);
          }
        }, 100);
      } else {
        // No cache, do normal load
        fetchVehicles(0, false, false);
      }
    }
    
    // Add visibility change listener to refresh data when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking for data updates');
        checkForDataChanges();
      }
    };
    
    // Listen for visibility changes (when user navigates back to this page)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Measure initial render performance
    setTimeout(() => {
      // Safely measure the render time
      const duration = safePerformance.measure('vehicle-list-initial-render', perfMark);
      if (duration !== null) {
        console.log(`Initial render time: ${duration.toFixed(2)}ms`);
      }
      
      // Clean up
      safePerformance.clear(perfMark, 'vehicle-list-initial-render');
    }, 0);
    
    return () => {
      isComponentMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up any performance marks
      safePerformance.clear(perfMark);
      
      // Save current state to cache when unmounting
      if (rawDataRef.current.length > 0) {
        vehicleCacheManager.set('vehicle_list_current', rawDataRef.current);
      }
    };
  }, [fetchVehicles, processVehicleData, checkForDataChanges]);

  // Initial load and infinite scroll
  useEffect(() => {
    fetchVehicles(0, false);
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && 
            !refreshingDataRef.current && hasMore && isComponentMountedRef.current) {
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

  // Direct delete handler that doesn't rely on fetching data again
  const handleDeleteSuccess = useCallback((deletedId: number) => {
    console.log(`Deleting vehicle with ID: ${deletedId}`);
    
    // Use requestAnimationFrame to ensure UI updates in sync with browser painting
    requestAnimationFrame(() => {
      // Immediately update the UI by filtering out the deleted item
      setRows(prevRows => {
        console.log(`Removing vehicle ${deletedId} from ${prevRows.length} rows`);
        return prevRows.filter(row => String(row.vehicleRegId) !== String(deletedId));
      });
      
      // Update total count
      setTotalElements(prev => Math.max(0, prev - 1));
    });
    
    // Handle cache and background tasks in a separate tick
    setTimeout(() => {
      // Update the raw data reference
      rawDataRef.current = rawDataRef.current.filter(
        vehicle => String(vehicle.vehicleRegId) !== String(deletedId)
      );
      
      // Update cache with the modified data
      try {
        vehicleCacheManager.set('vehicle_list_current', rawDataRef.current);
        
        // Invalidate any vehicle-specific cache
        const vehicleCacheKey = `vehicle_${deletedId}`;
        vehicleCacheManager.delete(vehicleCacheKey);
        
        // Notify other components about data change
        window.vehicleDataChanged = true;
        window.__FORCE_REFRESH_COUNTER++;
      } catch (error) {
        console.error("Cache update error:", error);
        // Non-critical error, can continue
      }
      
      // Reset modal state
      setOpen(false);
      setSelectedId("");
      setDeleteError(null);
      setIsDeleting(false);
      
      // Show success message
      setError("Vehicle deleted successfully");
      setTimeout(() => setError(null), 3000);
    }, 0);
  }, []);
  
  // Simple delete handler to open modal
  const handleDelete = useCallback((id: string) => {
    console.log(`Opening delete modal for vehicle: ${id}`);
    setSelectedId(id);
    setOpen(true);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  // Add handleDeleteAction before renderActionButtons
  const handleDeleteAction = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    handleDelete(id);
  }, [handleDelete]);

  // Update renderActionButtons dependencies
  const renderActionButtons = useCallback((params: GridCellParams) => {
    const vehicleId = params.row.vehicleRegId;
    
    const handleNavigation = (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(path);
    };
    
    return (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 0.7,
        width: '100%',
        maxWidth: '80px'
      }}>
        <IconButton 
          color="primary" 
          size="small" 
          onClick={(e) => handleNavigation(e, `/admin/vehicle/edit/${vehicleId}`)}
          sx={{ 
            p: 0.5,
            minWidth: '28px',
            minHeight: '28px',
            maxWidth: '28px',
            maxHeight: '28px',
            background: '#e3f2fd',
            border: '1px solid #bbdefb',
            '&:hover': { background: '#bbdefb' }
          }}
        >
          <EditIcon sx={{ fontSize: '16px' }} />
        </IconButton>
        
        <IconButton 
          color="primary" 
          size="small" 
          onClick={(e) => handleNavigation(e, `/admin/vehicle/add/servicepart/${vehicleId}`)}
          sx={{ 
            p: 0.5,
            minWidth: '28px',
            minHeight: '28px',
            maxWidth: '28px',
            maxHeight: '28px',
            background: '#e3f2fd',
            border: '1px solid #bbdefb',
            '&:hover': { background: '#bbdefb' }
          }}
        >
          <BuildIcon sx={{ fontSize: '16px' }} />
        </IconButton>
        
        <IconButton 
          size="small" 
          color="primary"
          onClick={(e) => handleNavigation(e, `/admin/vehicle/view/${vehicleId}`)}
          sx={{ 
            p: 0.5,
            minWidth: '28px',
            minHeight: '28px',
            maxWidth: '28px',
            maxHeight: '28px',
            background: '#212121',
            color: 'white',
            '&:hover': { background: '#424242' }
          }}
        >
          <Print sx={{ fontSize: '16px' }} />
        </IconButton>
        
        <IconButton 
          size="small" 
          color="error"
          onClick={(e) => handleDeleteAction(e, vehicleId)}
          disabled={isDeleting && selectedId === vehicleId}
          sx={{ 
            p: 0.5,
            minWidth: '28px',
            minHeight: '28px',
            maxWidth: '28px',
            maxHeight: '28px',
            background: '#f44336',
            color: 'white',
            '&:hover': { background: '#d32f2f' },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {isDeleting && selectedId === vehicleId ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <DeleteIcon sx={{ fontSize: '16px' }} />
          )}
        </IconButton>
      </Box>
    );
  }, [navigate, handleDeleteAction, isDeleting, selectedId]);

  // Update the second row of actions (service/print)
  const renderServiceButtons = useCallback((params: GridCellParams) => {
    const vehicleId = params.row.vehicleRegId;
    
    const handleNavigation = (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(path);
    };
    
    return (
      <Box sx={{ 
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        height: '100%'
      }}>
        <Tooltip title="Add Service Parts">
          <IconButton 
            color="info" 
            size="small" 
            onClick={(e) => handleNavigation(e, `/admin/vehicle/add/servicepart/${vehicleId}`)}
            sx={{ 
              padding: '6px',
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.2),
              }
            }}
          >
            <BuildIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View/Print">
          <IconButton 
            color="secondary" 
            size="small" 
            onClick={(e) => handleNavigation(e, `/admin/vehicle/view/${vehicleId}`)}
            sx={{ 
              padding: '6px',
              backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.2),
              }
            }}
          >
            <Print fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }, [navigate]);

  // Redesign status render
  const renderStatus = useCallback((params: GridCellParams) => {
    const status = params.value as string;
    let bgcolor = '#e3f2fd';
    let textColor = '#1976d2';
    let StatusIcon = null;
    
    if (status?.toLowerCase().includes('complete')) {
      bgcolor = '#e8f5e9';
      textColor = '#2e7d32';
      StatusIcon = CheckCircleIcon;
    } else if (status?.toLowerCase().includes('progress')) {
      bgcolor = '#fff8e1';
      textColor = '#ed6c02';
      StatusIcon = BuildIcon;
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#FFF8E1',
            color: '#F57C00',
          }}
        >
          <Box sx={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            bgcolor: '#F57C00',
            mr: 0.5,
            animation: 'pulse 1.5s infinite ease-in-out'
          }} />
          In Progress
        </Box>
      );
    } else if (status?.toLowerCase().includes('waiting')) {
      bgcolor = '#e3f2fd';
      textColor = '#0288d1';
      StatusIcon = AccessTimeIcon;
      return (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#E3F2FD',
            color: '#0288D1',
          }}
        >
          <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />
          Waiting
        </Box>
      );
    }
    
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderRadius: '16px',
          fontSize: '0.75rem',
          fontWeight: 600,
          bgcolor,
          color: textColor,
        }}
      >
        {StatusIcon && (
          <Box component={StatusIcon} sx={{ fontSize: '0.875rem', mr: 0.5 }} />
        )}
        {status}
      </Box>
    );
  }, []);

  const renderInvoiceStatus = useCallback((params: GridCellParams) => {
    const hasInvoice = params.row.hasInvoice;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {hasInvoice ? (
          <CheckCircleIcon color="success" sx={{ fontSize: '1.25rem' }} />
        ) : (
          <CancelIcon color="error" sx={{ fontSize: '1.25rem' }} />
        )}
      </Box>
    );
  }, []);

  const columns = React.useMemo<GridColDef[]>(() => [
    {
      field: 'Action',
      headerName: 'Actions',
      width: 85,
      minWidth: 85,
      renderCell: renderActionButtons,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      cellClassName: 'wrap-cell-content',
      disableColumnMenu: true,
      flex: 0, 
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 100,
      minWidth: 90,
      maxWidth: 120,
      flex: 0.5,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          textAlign: 'left',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'vehicleNoName',
      headerName: 'Vehicle Number',
      width: 140,
      minWidth: 120,
      flex: 1,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => {
        const parts = params.value?.toString().split('-');
        
        return (
          <Box sx={{ 
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '@media (max-width: 600px)': {
              fontSize: '0.8125rem',
            }
          }}>
            <Typography sx={{ 
              fontWeight: 500,
              '@media (max-width: 600px)': {
                fontSize: '0.8125rem',
              }
            }}>
              {parts?.[0] || params.value}
            </Typography>
            {parts?.[1] && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: 'block',
                  '@media (max-width: 600px)': {
                    fontSize: '0.75rem',
                  }
                }}
              >
                {parts.slice(1).join('-')}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'customerMobile',
      headerName: 'Customer & Mobile',
      width: 160,
      minWidth: 130,
      flex: 1.2,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => {
        const [name, mobile] = (params.value?.toString().split('-').map((s: string) => s.trim()) || []);
        return (
          <Box sx={{ 
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '@media (max-width: 600px)': {
              fontSize: '0.8125rem',
            }
          }}>
            <Typography sx={{ 
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '@media (max-width: 600px)': {
                fontSize: '0.8125rem',
              }
            }}>
              {name}
            </Typography>
            {mobile && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '@media (max-width: 600px)': {
                    fontSize: '0.75rem',
                  }
                }}
              >
                {mobile}
              </Typography>
            )}
          </Box>
        );
      },
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 110,
      minWidth: 100,
      flex: 0.7,
      cellClassName: 'wrap-cell-content',
      renderCell: renderStatus 
    },
    { 
      field: 'advance', 
      headerName: 'Advance', 
      width: 100,
      minWidth: 80,
      flex: 0.6,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          ₹{params.row.advance}
        </Box>
      )
    },
    { 
      field: 'kilometer', 
      headerName: 'Kilometer', 
      width: 110,
      minWidth: 80,
      flex: 0.6,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          {params.row.kilometer}
        </Box>
      )
    },
    { 
      field: 'hasInvoice', 
      headerName: 'Invoice', 
      width: 80,
      minWidth: 70,
      flex: 0.4,
      cellClassName: 'wrap-cell-content',
      renderCell: renderInvoiceStatus,
      headerAlign: 'center',
      align: 'center'
    },
    { 
      field: 'superwiser', 
      headerName: 'Supervisor', 
      width: 120,
      minWidth: 100,
      flex: 0.8,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'technician', 
      headerName: 'Technician', 
      width: 120,
      minWidth: 100,
      flex: 0.8,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'worker', 
      headerName: 'Worker', 
      width: 120,
      minWidth: 100,
      flex: 0.8,
      cellClassName: 'wrap-cell-content',
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '@media (max-width: 600px)': {
            fontSize: '0.8125rem',
          }
        }}>
          {params.value}
        </Box>
      )
    },
  ], [renderStatus, renderInvoiceStatus, renderActionButtons]);
    
  const filteredRows = React.useMemo(() => {
    const searchTerm = localSearchTerm.toLowerCase();
    if (!searchTerm) return rows;
    
    return rows.filter((row) => (
      (row.vehicleNoName && row.vehicleNoName.toLowerCase().includes(searchTerm)) ||
      (row.customerMobile && row.customerMobile.toLowerCase().includes(searchTerm)) ||
      (row.status && row.status.toLowerCase().includes(searchTerm)) ||
      (row.superwiser && row.superwiser.toLowerCase().includes(searchTerm)) ||
      (row.technician && row.technician.toLowerCase().includes(searchTerm)) ||
      (row.worker && row.worker.toLowerCase().includes(searchTerm)) ||
      (row.kilometer && row.kilometer.toString().includes(searchTerm)) ||
      (row.advance && row.advance.toString().includes(searchTerm))
    ));
  }, [rows, localSearchTerm]);
  
  const handleLocalSearch = useCallback((term: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setLocalSearchTerm(term.toLowerCase());
    }, DEBOUNCE_DELAY);
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
          kilometer: singleVehicle.kmsDriven ?? '',
          vehicleRegId: singleVehicle.vehicleRegId,
          hasInvoice: false
        }]);
        setTotalElements(1);
        setTotalPages(1);
        
        // Check invoice status directly without using updateInvoiceStatus
        setTimeout(() => {
          checkInvoiceStatus(singleVehicle.vehicleRegId)
            .then((hasInvoice: boolean) => {
              if (hasInvoice) {
                setRows(currentRows => 
                  currentRows.map(row => 
                    row.vehicleRegId === singleVehicle.vehicleRegId 
                      ? {...row, hasInvoice} 
                      : row
                  )
                );
              }
            })
            .catch(console.error);
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
  }, [dateValue, handleApiError, isSearching, processVehicleData, selectedType, textInput]);
    
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

  const isMobile = window.innerWidth <= 600;

  // Function to check if a vehicle was recently added or modified
  const isRecentlyModified = useCallback((vehicleId: string) => {
    try {
      const recentChanges = JSON.parse(localStorage.getItem('recentVehicleChanges') || '[]');
      return recentChanges.includes(vehicleId);
    } catch (e) {
      return false;
    }
  }, []);

  // Add recently modified vehicles to track changes
  const markAsModified = useCallback((vehicleId: string) => {
    try {
      const recentChanges = JSON.parse(localStorage.getItem('recentVehicleChanges') || '[]');
      if (!recentChanges.includes(vehicleId)) {
        recentChanges.push(vehicleId);
        localStorage.setItem('recentVehicleChanges', JSON.stringify(recentChanges));
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Update handleEdit to mark vehicles as modified
  const handleEdit = useCallback((id: string) => {
    // Set a flag to indicate data will need refresh when returning
    window.vehicleDataChanged = true;
    localStorage.setItem('needsRefreshOnReturn', 'true');
    // Mark this vehicle as modified
    markAsModified(id);
    // Navigate to edit page
    navigate(`/admin/vehicle/edit/${id}`);
  }, [navigate, markAsModified]);

  const handleService = useCallback((id: string) => {
    // Set a flag to indicate data will need refresh when returning
    window.vehicleDataChanged = true;
    localStorage.setItem('needsRefreshOnReturn', 'true');
    // Navigate to service page
    navigate(`/admin/vehicle/service/${id}`);
  }, [navigate]);

  const handleDetails = useCallback((id: string) => {
    navigate(`/admin/vehicle/view/${id}`);
  }, [navigate]);

  const handlePrint = useCallback((id: string) => {
    navigate(`/admin/vehicle/print/${id}`);
  }, [navigate]);

  // Clear the highlights after a delay
  useEffect(() => {
    // If we have recent changes, set a timer to clear them
    const recentChanges = JSON.parse(localStorage.getItem('recentVehicleChanges') || '[]');
    if (recentChanges.length > 0) {
      // Clear highlights after 10 seconds
      const timer = setTimeout(() => {
        localStorage.removeItem('recentVehicleChanges');
        // Trigger a re-render to remove highlights
        forceUpdate();
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [forceUpdate, filteredRows]);

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
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    flexGrow: 1, 
                    animation: 'fadeIn 0.3s',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0 },
                      '100%': { opacity: 1 }
                    }
                  }}
                >
                  {error}
                </Alert>
              )}
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => {
                // Set flag for refresh when returning
                window.vehicleDataChanged = true;
                localStorage.setItem('needsRefreshOnReturn', 'true');
                // Navigate to add page
                navigate("/admin/vehicle/add");
              }}
            >
          Add Vehicle
        </Button>
            </Stack>
      </Stack>

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

          <Box 
                sx={{ 
            position: 'relative',
              height: 'auto',
            width: '100%',
              overflow: 'visible',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              '@media (max-width: 600px)': {
                overflow: 'visible',
                height: 'auto',
                maxHeight: 'none',
              },
            }}
          >
            {initialLoad ? (
              <SkeletonLoading />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: 'auto',
                overflow: 'visible',
                '@media (max-width: 600px)': {
                  overflow: 'visible',
                  width: '100%'
                }
              }}>
                <CustomizedDataGrid 
                  columns={columns} 
                  rows={filteredRows}
                    autoHeight={true}
                    density="standard"
                  checkboxSelection={false}
                  disableRowSelectionOnClick
                    getRowHeight={() => 'auto'}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 20 } },
                    }}
                    getRowClassName={(params) => params.row.isNew ? 'highlighted-row' : ''}
                    pageSizeOptions={[10, 20, 50, 100]}
                    disableColumnMenu
                    columnVisibilityModel={{
                      superwiser: window.innerWidth > 1200,
                      technician: window.innerWidth > 1100,
                      worker: window.innerWidth > 1000,
                    }}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      border: 'none',
                      borderRadius: 1,
                      overflow: 'visible',
                      '& .highlighted-row': {
                        backgroundColor: alpha(theme.palette.success.light, 0.15),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.success.light, 0.25),
                        },
                        '& .MuiDataGrid-cell': {
                          borderColor: alpha(theme.palette.success.main, 0.2),
                        }
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #f0f0f0',
                        padding: '8px 16px',
                        fontSize: '0.875rem',
                        whiteSpace: 'normal !important',
                        wordWrap: 'break-word',
                        lineHeight: '1.43',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '@media (max-width: 600px)': {
                          padding: '8px',
                        },
                        '&.wrap-cell-content': {
                          whiteSpace: 'normal',
                          lineHeight: '1.2em',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                        },
                      },
                      '& .MuiDataGrid-row': {
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                        minHeight: '36px !important',
                        maxHeight: 'none !important',
                        '@media (max-width: 600px)': {
                          minHeight: '48px !important',
                        },
                      },
                      '& .MuiDataGrid-columnHeader': {
                        padding: '8px 16px',
                        backgroundColor: '#fafafa',
                        borderBottom: '1px solid #e0e0e0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '@media (max-width: 600px)': {
                          padding: '8px',
                          '& .MuiDataGrid-columnHeaderTitle': {
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        },
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        borderBottom: 'none',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        backgroundColor: '#fafafa',
                      },
                      '& .MuiDataGrid-columnHeaderTitleContainer': {
                        padding: '0',
                        overflow: 'hidden',
                      },
                      '& .MuiDataGrid-root': {
                        borderWidth: 0
                      },
                      '& .MuiTablePagination-root': {
                        margin: 0,
                        borderTop: '1px solid #e0e0e0',
                      },
                      '& .MuiDataGrid-iconSeparator': {
                        display: 'none'
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        overflow: 'visible',
                        '@media (max-width: 600px)': {
                          overflow: 'visible'
                        },
                      },
                      '& .MuiDataGrid-main': {
                        overflow: 'visible',
                        maxWidth: '100%',
                        '@media (max-width: 600px)': {
                          overflow: 'visible', 
                        },
                      },
                      '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: '1px solid #e0e0e0',
                        backgroundColor: '#fafafa',
                      },
                    }}
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
              </Box>
            )}
            
            <div ref={lastElementRef} style={{ height: 10, width: '100%' }} />
          </Box>
          
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
        onClose={() => {
          setOpen(false);
          setDeleteError(null);
          setIsDeleting(false);
        }} 
        deleteItemId={selectedId ? Number(selectedId) : undefined} 
        onDeleteSuccess={handleDeleteSuccess}
        isDeleting={isDeleting}
        error={deleteError}
      />
      
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}