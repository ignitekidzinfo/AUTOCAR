import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Button,
  Tooltip,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
  Divider,
  useTheme,
  alpha,
  Grid,
  useMediaQuery,
  CircularProgress,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridCellParams,
  GridColumnHeaderParams,
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import apiClient from 'utils/apiClient';

interface UserPart {
  userPartId: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: number;
  price: number;
  buyingPrice: number;
  description: string;
  gst?: number;
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

const PAGE_SIZE = 50;
const MAX_SEARCH_PAGES = 3;
const LOW_STOCK_THRESHOLD = 2;
const SCROLL_THRESHOLD = 200; 
const RETRY_DELAY = 3000; 
const MAX_RETRIES = 3; 
const ERROR_DISPLAY_DURATION = 5000; 

/**
 * Manages the search cache invalidation
 */
const searchCacheManager = {
  // Set the last update time to invalidate search cache
  updateLastModified: () => {
    try {
      localStorage.setItem('spareParts_lastModified', Date.now().toString());
    } catch (e) {
      console.error('Error setting cache invalidation timestamp:', e);
    }
  },
  
  // Check if the search cache should be invalidated
  isSearchCacheValid: (maxAge = 60000) => { // Default: 1 minute
    try {
      const lastModified = localStorage.getItem('spareParts_lastModified');
      if (!lastModified) return false;
      
      const timestamp = parseInt(lastModified, 10);
      return Date.now() - timestamp < maxAge;
    } catch (e) {
      return false;
    }
  },
  
  // Clear search results from localStorage
  clearSearchCache: () => {
    try {
      // Clear any items related to spare parts search
      Object.keys(localStorage)
        .filter(key => key.startsWith('search_') || key.includes('spareParts'))
        .forEach(key => localStorage.removeItem(key));
        
      // Update the last modified time
      searchCacheManager.updateLastModified();
    } catch (e) {
      console.error('Error clearing search cache:', e);
    }
  }
};

const UserPartList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const [isSorted, setIsSorted] = useState<boolean>(false);

  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Clear search cache on component mount to ensure fresh data
    searchCacheManager.clearSearchCache();
    
    return () => {
      // Update last modified time when component unmounts
      searchCacheManager.updateLastModified();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.width = '100%';
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarToggle', handleResize);
    
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarToggle', handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const formatPartData = (part: UserPart) => ({
    id: part.userPartId,
    partNumber: part.partNumber || "",
    partName: part.partName || "",
    description: part.description || "",
    manufacturer: part.manufacturer || "",
    quantity: Number(part.quantity || 0),
    price: part.price || 0,
    buyingPrice: part.buyingPrice || 0,
    gst: part.gst || 18,
  });

  const fetchUserPartsPage = useCallback(async (pageNumber: number) => {
    if (loadingRef.current) {
      return;
    }
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    setLoading(true);
    
    loadingRef.current = true;
    
    try {
      console.log(`Fetching page ${pageNumber} with size ${PAGE_SIZE}`);
      
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      
      const response = await apiClient.get<PaginatedResponse<UserPart>>('/userParts/getAll', {
        params: { 
          page: pageNumber, 
          size: PAGE_SIZE,
          _t: timestamp  // Add timestamp to prevent caching
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        timeout: 30000,
      });
      
      const { content, totalPages, totalElements, currentPage } = response.data;
      
      console.log(`Received ${content.length} items for page ${currentPage}, total pages: ${totalPages}`);
      
      const formattedRows = content.map(formatPartData);
      
      const filteredRows = formattedRows.filter(row => !deletedIds.has(row.id));
      
      console.log(`Filtered out ${formattedRows.length - filteredRows.length} deleted items`);
      
      setTotalElements(totalElements - (formattedRows.length - filteredRows.length));
      setTotalPages(totalPages);
      setPage(currentPage);
      
      setRows(filteredRows);
      
      const lowStock = filteredRows.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD).length;
      setLowStockCount(lowStock);
      
      setError(null);
      
      return true;
    } catch (err: any) {
      console.error("Error fetching user parts:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load data. Please try again.');
      }
      
      return false;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [deletedIds]);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    fetchUserPartsPage(value - 1);
  }, [fetchUserPartsPage]);

  useEffect(() => {
    if (!initialLoad) return;

    try {
      const storedDeletedIds = localStorage.getItem('deletedPartIds');
      if (storedDeletedIds) {
        const parsedIds = JSON.parse(storedDeletedIds);
        if (Array.isArray(parsedIds) && parsedIds.length > 0) {
          setDeletedIds(new Set(parsedIds));
          console.log(`Loaded ${parsedIds.length} previously deleted IDs from localStorage`);
        }
      }
    } catch (e) {
      console.error('Failed to load deleted IDs from localStorage:', e);
    }

    fetchUserPartsPage(0);
    setInitialLoad(false);
  }, [initialLoad, fetchUserPartsPage]);

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchText.trim()) {
      setIsSearchMode(false);
      setRows([]);
      setPage(0);
      fetchUserPartsPage(0);
      return;
    }
    
    setIsSearchMode(true);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Searching for: ${searchTerm}`);
      
      // Check if we should use cached results
      const cacheKey = `search_results_${searchTerm.toLowerCase().trim()}`;
      const shouldUseCache = searchCacheManager.isSearchCacheValid();
      let cachedResults = null;
      
      // Try to get cached results if cache is valid
      if (shouldUseCache) {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            cachedResults = JSON.parse(cachedData);
            console.log('Using cached search results');
          }
        } catch (e) {
          console.error('Error reading cached search results:', e);
        }
      }
     
      // If we have valid cached results, use them
      if (cachedResults && Array.isArray(cachedResults)) {
        processSearchResults(cachedResults);
        return;
      }
      
      // Add a timestamp to prevent browser caching
      const timestamp = Date.now();
      const url = `/Filter/userPartSearchBarFilter?searchBarInput=${searchTerm}&_t=${timestamp}`;
      
      const response = await apiClient.get(url, {
        headers: {
          // Add cache control headers to prevent caching
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        timeout: 30000,
      });
          
      if (!Array.isArray(response.data)) {
        console.warn("API response is not an array:", response.data);
        setRows([]);
        setError('Search returned an unexpected response. Please try again.');
        return;
      }
      
      // Cache the results for future searches
      try {
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        console.error('Error caching search results:', e);
      }
      
      // Process the search results
      processSearchResults(response.data);
      
    } catch (err: any) {
      console.error("Error searching parts:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Search is taking longer than expected. Please try a more specific search term.');
      } else {
        setError('Search could not be completed. Please try again.');
      }
      
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUserPartsPage, searchText, deletedIds]);

  // Helper function to process search results
  const processSearchResults = useCallback((data: any[]) => {
    // Filter out any items that have been marked as deleted locally
    const filteredResults = data.filter((part: any) => {
      const partId = part.sparePartId || part.userPartId || 0;
      return !deletedIds.has(partId);
    });
    
    // Verify each part exists by checking quantity
    const existingParts = filteredResults.filter((part: any) => {
      // Consider a part as non-existent if it has userPartId/sparePartId = 0 or undefined
      return (part.sparePartId && part.sparePartId !== 0) || 
             (part.userPartId && part.userPartId !== 0);
    });
    
    const formattedResults = existingParts.map((part: any) => {
      // Make sure we use userPartId as the primary ID, not sparePartId
      return {
        id: part.userPartId || 0, // Use userPartId as the primary ID
        partNumber: part.partNumber || '',
        partName: part.partName || '',
        description: part.description || '',
        manufacturer: part.manufacturer || '',
        quantity: part.quantity !== undefined ? Number(part.quantity) : 0,
        price: part.price || 0,
        buyingPrice: part.buyingPrice || 0,
        gst: part.gst || 18,
        // Store sparePartId separately if needed
        sparePartId: part.sparePartId || 0
      };
    });
    
    console.log("Formatted search results:", formattedResults);
    
    setRows(formattedResults);
    setTotalElements(formattedResults.length);
    setTotalPages(Math.ceil(formattedResults.length / PAGE_SIZE));
    
    const lowStock = formattedResults.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD).length;
    setLowStockCount(lowStock);
    
    // If no results were found, show a helpful message
    if (formattedResults.length === 0) {
      setError(`No parts found matching "${searchText}". Try a different search term.`);
    }
  }, [deletedIds, searchText]);

  const handleSearchClick = () => {
    handleSearch(searchText);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setIsSearchMode(false);
    setRows([]);
    setPage(0);
    fetchUserPartsPage(0);
  };

  const handleDeleteClick = (id: number) => {
    deleteItem(id);
  };

  const invalidatePartsCaches = useCallback(() => {
    // Update the last modified timestamp to invalidate search caches
    searchCacheManager.updateLastModified();
    
    // Clear any search-related caches
    searchCacheManager.clearSearchCache();
  }, []);

  const deleteItem = async (id: number) => {
    if (!id) return;
    
    setDeleteLoading(true);
    
    try {
      await apiClient.delete(`/userParts/delete/${id}`);
      
      // Update local state
      setDeletedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      
      // Store deleted IDs
      try {
        const existingDeletedIds = JSON.parse(localStorage.getItem('deletedPartIds') || '[]');
        existingDeletedIds.push(id);
        localStorage.setItem('deletedPartIds', JSON.stringify([...new Set(existingDeletedIds)]));
      } catch (e) {
        console.error('Failed to store deleted IDs in localStorage:', e);
      }
      
      // Update UI
      setRows(rows.filter(row => row.id !== id));
      setDeleteSuccess("Part deleted successfully");
      setTotalElements(prev => prev - 1);
      
      // Update low stock count
      const updatedLowStock = rows
        .filter(item => item.id !== id && Number(item.quantity) < LOW_STOCK_THRESHOLD)
        .length;
      setLowStockCount(updatedLowStock);
      
      // Invalidate caches to ensure fresh data on next search
      invalidatePartsCaches();
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        fetchUserPartsPage(page);
        fetchTimeoutRef.current = null;
      }, 1000);
      
    } catch (err: any) {
      console.error("Error deleting part:", err);
      
      let errorMessage = 'Failed to delete part. Please try again.';
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = 'Authorization error. Please login again.';
            break;
          case 404:
            errorMessage = 'Part not found. It may have been already deleted.';
        
            setDeletedIds(prev => {
              const newSet = new Set(prev);
              newSet.add(id);
              return newSet;
            });
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      }
      
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
      setDeleteItemId(null);
      
      if (deleteSuccess) {
        setTimeout(() => {
          setDeleteSuccess(null);
        }, 3000);
      }
    }
  };

  const handleSortByQuantity = () => {
    if (rows.length === 0) return;

    setIsSorted(!isSorted);
    
    if (!isSorted) {
      const sortedRows = [...rows].sort((a, b) => {
        return Number(a.quantity) - Number(b.quantity);
      });
      setRows(sortedRows);
    } else {
      fetchUserPartsPage(page);
    }
  };

  const renderHeaderWithTooltip = (params: GridColumnHeaderParams) => {
    if (!params || !params.colDef) {
      return <span>Unknown</span>;
    }

    const headerName = params.colDef.headerName || '';
    
    if (isMobile && headerName.includes(' ')) {
      const words = headerName.split(' ');
      
      return (
        <Tooltip title={headerName}>
          <Box sx={{ 
            lineHeight: 1.2, 
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.7rem',
            padding: 0.5,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'visible',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}>
            {words.map((word, index) => (
              <div key={index} style={{ width: '100%', overflow: 'visible' }}>{word}</div>
            ))}
          </Box>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip title={headerName}>
        <Box sx={{ 
          fontWeight: 600, 
          fontSize: '0.8rem',
          padding: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          overflow: 'visible',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}>
          {headerName}
        </Box>
      </Tooltip>
    );
  };

  const getColumns = (): GridColDef[] => {
    const baseColumnWidth = isMobile ? 100 : 130;
    
    const columns: GridColDef[] = [
    {
        field: 'actions',
        headerName: 'Actions',
        width: isMobile ? 110 : 130,
        minWidth: 110,
        flex: 0, 
        sortable: false,
        filterable: false,
        renderCell: (params: GridCellParams) => (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View Details">
              <IconButton
                color="primary"
                onClick={() => {
                  console.log("Navigating to part details with ID:", params.row.id);
                  navigate(`/admin/user-part/view/${params.row.id}`);
                }}
                size="small"
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  },
                  padding: isMobile ? '2px' : '8px',
                }}
              >
                <VisibilityIcon fontSize={isMobile ? "small" : "small"} sx={{ fontSize: isMobile ? '0.9rem' : '1.2rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Part">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(params.row.id)}
                size="small"
                sx={{ 
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                  },
                  padding: isMobile ? '2px' : '8px',
                }}
              >
                <DeleteIcon fontSize={isMobile ? "small" : "small"} sx={{ fontSize: isMobile ? '0.9rem' : '1.2rem' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
        renderHeader: renderHeaderWithTooltip,
    },
    {
        field: 'partNumber',
        headerName: 'Part Number',
        width: isMobile ? 80 : 120,
        minWidth: 80,
        flex: isMobile ? 0 : 0.8,
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const partNumber = params.value as string || '—';
          return (
            <Tooltip title={partNumber}>
              <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                {partNumber}
              </Typography>
            </Tooltip>
          );
        },
    },
    {
        field: 'partName',
        headerName: 'Spare Name',
        width: isMobile ? baseColumnWidth : baseColumnWidth * 1.2,
        minWidth: 100,
        flex: isMobile ? 0.5 : 1,
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const partName = params.value as string || '—';
          return (
            <Tooltip title={partName}>
              <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                {partName}
              </Typography>
            </Tooltip>
          );
        },
    },
    {
        field: 'description',
        headerName: 'Description',
        width: isMobile ? baseColumnWidth : baseColumnWidth * 1.6,
        minWidth: 100,
        flex: isMobile ? 0.5 : 1.2,
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const description = params.value as string || '—';
          return (
            <Tooltip title={description}>
              <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
                {description}
              </Typography>
            </Tooltip>
          );
        },
    }
    ];

    columns.push(
    {
        field: 'buyingPrice',
        headerName: 'Purchase Rate',
        width: isMobile ? 100 : 120,
        minWidth: 100,
        flex: 0,
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const buyingPrice = Number(params.value);
          return (
            <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
              {isMobile ? `₹${buyingPrice}` : `₹${buyingPrice.toString()}`}
            </Typography>
          );
        },
    },
    {
        field: 'price',
        headerName: 'Sale Rate',
        width: isMobile ? 90 : 110,
        minWidth: 90,
        flex: 0, 
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const price = Number(params.value);
          return (
            <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
              {isMobile ? `₹${price}` : `₹${price.toString()}`}
            </Typography>
          );
        },
    },
    {
        field: 'gst',
        headerName: 'GST%',
        width: isMobile ? 70 : 80,
        minWidth: 70,
        flex: 0, 
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const gst = params.row.gst ? Number(params.row.gst) : 18;
          return (
            <Typography variant="body2" noWrap sx={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>
              {gst}
            </Typography>
          );
        },
    },
    {
      field: 'quantity',
        headerName: 'Stock Qty',
        width: isMobile ? 85 : 100,
        minWidth: 85,
        flex: 0, 
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
        renderCell: (params: GridCellParams) => {
          const quantity = Number(params.value);
          const isLowStock = quantity < LOW_STOCK_THRESHOLD;
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              color: isLowStock ? theme.palette.error.main : 'inherit',
              fontWeight: isLowStock ? 'bold' : 'normal',
              fontSize: isMobile ? '0.7rem' : 'inherit',
            }}>
              {isLowStock && (
                <WarningIcon color="error" fontSize="small" sx={{ mr: isMobile ? 0 : 0.5, fontSize: isMobile ? '0.9rem' : '1.2rem' }} />
              )}
              {quantity}
            </Box>
          );
        },
    },
    {
        field: 'viewSupplier',
        headerName: 'Spare Supplier',
        width: isMobile ? 130 : 170,
        minWidth: 130,
        flex: 0, 
        sortable: false,
        filterable: false,
        renderCell: (params: GridCellParams) => (
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                if (params.row.partNumber && params.row.manufacturer) {
                  navigate(`/admin/spare-supplier/${params.row.partNumber}/${params.row.manufacturer}`, {
                    state: { 
                      description: params.row.description || '',
                      quantity: params.row.quantity || 0,
                      price: params.row.price || 0
                    }
                  });
                }
              }}
              disabled={!params.row.manufacturer || !params.row.partNumber}
              sx={{ 
                backgroundColor: '#4caf50',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#45a049',
                },
                borderRadius: 1,
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.25 : 'inherit',
                fontSize: isMobile ? '0.6rem' : '0.875rem',
                minWidth: isMobile ? '95px' : '120px',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                maxWidth: '100%',
              }}
            >
              {isMobile ? "Suppliers" : "View Suppliers"}
            </Button>
          </Box>
        ),
        renderHeader: renderHeaderWithTooltip,
    }
    );

    return columns;
  };

  const handleApiError = (err: any, customMessage?: string) => {
    console.error("API Error:", err);
    
    let errorMessage = customMessage || 'Failed to load data. Please try again.';
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Loading will continue automatically.';
    } else if (err.response) {
      switch (err.response.status) {
        case 401:
          errorMessage = 'Your session has expired. Please refresh the page and login again.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server error. We\'re working to fix this issue.';
          break;
      }
    }
    
    setError(errorMessage);
    
    if (err.code === 'ECONNABORTED') {
      setTimeout(() => {
        setError(null);
      }, ERROR_DISPLAY_DURATION);
    }
    
    return errorMessage;
  };

  const handleRefresh = () => {
    setLoading(true);
    
    // Clear any potential browser cache for the API endpoints
    const urls = [
      '/userParts/getAll',
      '/Filter/userPartSearchBarFilter'
    ];
    
    // Try to clear browser cache for these URLs
    try {
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.open(cacheName).then(cache => {
              urls.forEach(url => {
                cache.delete(url).catch(() => {});
              });
            });
          });
        });
      }
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
    
    // Clear search cache in localStorage
    searchCacheManager.clearSearchCache();
    
    // If we're in search mode, reset the search
    if (isSearchMode) {
      setSearchText("");
      setIsSearchMode(false);
      setRows([]);
    }
    
    // Force a fresh fetch with cache busting
    fetchUserPartsPage(0);
  };

  const clearDeletedItemsFilter = () => {
    setDeletedIds(new Set());
    localStorage.removeItem('deletedPartIds');
    
    // Invalidate all caches to ensure fresh data
    searchCacheManager.clearSearchCache();
    
    setDeleteSuccess("Filter cleared. Refreshing data...");
    
    // Force a fresh fetch from the server
    fetchUserPartsPage(0);
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        p: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
      ref={containerRef}
    >
      <Card elevation={3} sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', 
        mb: { xs: 2, md: 4 },
        width: '100%',
        maxWidth: '100%'
      }}>
        <Box 
          sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}
        >
          <Box sx={{ mx: 'auto', maxWidth: '600px' }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="h1" 
              fontWeight="bold" 
              sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
            >
              <InventoryIcon color="primary" />
              Parts Inventory
            </Typography>
            {!isMobile && (
              <Typography variant="body2" color="text.secondary">
                Manage your parts inventory and track stock levels
              </Typography>
            )}
          </Box>
        </Box>
        
        <CardContent sx={{ p: 0 }}>
          {/* Summary Cards */}
          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={6} sm={6} md={3} lg={2}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant={isMobile ? "caption" : "subtitle2"} color="text.secondary">Total Parts</Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
                    {totalElements || '0'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={6} md={3} lg={2}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant={isMobile ? "caption" : "subtitle2"} color="text.secondary">Low Stock Items</Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="error.main" sx={{ mt: 1 }}>
                    {lowStockCount}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={12} md={6} lg={8}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant={isMobile ? "caption" : "subtitle2"} color="text.secondary">Quick Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        size={isMobile ? "small" : "medium"}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading}
                        sx={{ borderRadius: 1.5 }}
                      >
                        {loading ? "Refreshing..." : "Refresh"}
                      </Button>
                      
                      {deletedIds.size > 0 && (
                        <Button 
                          variant="outlined" 
                          color="secondary"
                          size={isMobile ? "small" : "medium"}
                          onClick={clearDeletedItemsFilter}
                          disabled={loading}
                          sx={{ borderRadius: 1.5 }}
                        >
                          Clear Filter ({deletedIds.size})
                        </Button>
                      )}
                      
                      <Button 
                        variant="outlined" 
                        size={isMobile ? "small" : "medium"}
                        startIcon={<SortIcon />}
                        onClick={handleSortByQuantity}
                        sx={{ 
                          borderRadius: 1.5,
                          backgroundColor: isSorted ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        }}
                      >
                        {isSorted ? "Reset Sort" : "Sort By Low Stock"}
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="secondary"
                        size={isMobile ? "small" : "medium"}
                        startIcon={<BusinessCenterIcon />}
                        onClick={() => navigate('/admin/vendorManagement')}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Manage Suppliers
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Search Box */}
          <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}>
            <FormControl fullWidth variant="outlined" size={isMobile ? "small" : "medium"}>
              <OutlinedInput
                placeholder={isMobile ? "Search parts..." : "Search by part number, name, manufacturer or description..."}
                value={searchText}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchClick();
                  }
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isSearchMode && (
                        <Button 
                          onClick={handleClearSearch} 
                          variant="outlined" 
                          color="secondary"
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        >
                          Clear
                        </Button>
                      )}
                      <Button 
                        onClick={handleSearchClick} 
                        variant="contained" 
                        size="small"
                        sx={{ borderRadius: 1.5 }}
                      >
                        Search
                      </Button>
                    </Box>
                  </InputAdornment>
                }
                sx={{ borderRadius: 2 }}
              />
            </FormControl>
          </Box>

          {/* Data Grid */}
          <Box
            sx={{
              px: { xs: 0.5, sm: 3 },
              pb: { xs: 1, sm: 3 },
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Error message */}
            {error && (
              <Box
                sx={{
                  width: '100%',
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                  {error}
                </Typography>
              </Box>
            )}
            
            <Box
              sx={{
                width: '100%', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                overflowX: 'auto',
                display: 'flex',
                flexGrow: 1,
                WebkitOverflowScrolling: 'touch',
                paddingRight: isMobile ? 1 : 0,
              }}
            >
              <div style={{ 
                width: '100%',
                flexGrow: 1,
                display: 'flex',
                minWidth: isMobile ? '750px' : 'auto', // Increased to ensure all columns fit
              }}>
                <DataGrid
                  rows={rows || []}
                  columns={getColumns()}
                  loading={loading}
                  autoHeight
                  disableRowSelectionOnClick
                  hideFooter={true}
                  disableColumnMenu
                  disableColumnSorting
                  getRowClassName={(params) =>
                    Number(params.row.quantity) < LOW_STOCK_THRESHOLD ? 'low-stock' : ''
                  }
                  rowHeight={isMobile ? 40 : 52}
                  sx={{
                    border: 'none',
                    width: '100%',
                    flexGrow: 1,
                    '& .MuiDataGrid-root': {
                      width: '100%',
                      flexGrow: 1,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      height: isMobile ? '80px !important' : '60px !important',
                      maxHeight: isMobile ? '80px !important' : '60px !important',
                      lineHeight: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      overflow: 'visible',
                      lineHeight: 1.2,
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: isMobile ? '0.65rem' : '0.85rem',
                      width: '100%',
                      textAlign: 'center',
                      padding: isMobile ? 0.5 : 1,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    },
                    '& .MuiDataGrid-columnHeader': {
                      padding: isMobile ? '4px' : '8px',
                      outline: 'none !important',
                      overflow: 'visible',
                    },
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      padding: 0,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'visible',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      fontSize: isMobile ? '0.7rem' : 'inherit',
                      padding: isMobile ? '1px 2px' : '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                    '& .MuiDataGrid-cell:last-child': {
                      paddingRight: 1,
                    },
                    '& .MuiDataGrid-row': {
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    },
                    '& .low-stock': {
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.12),
                      },
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      width: '100% !important',
                    },
                    '&::-webkit-scrollbar': {
                      height: '8px',
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                />
              </div>
            </Box>
          </Box>
          
          {/* Load More / Info Footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderTop: `1px solid ${theme.palette.divider}`,
              p: { xs: 2, sm: 2 },
              gap: 2
            }}
          >
            {deletedIds.size > 0 && (
              <Box
                sx={{ 
                  width: '100%', 
                  maxWidth: '500px',
                  mb: 1,
                  p: 1.5,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.5)}`,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2" color="info.main">
                  {deletedIds.size} deleted item(s) are hidden from view
                </Typography>
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={clearDeletedItemsFilter} 
                  sx={{ ml: 2 }}
                >
                  Show All
                </Button>
              </Box>
            )}
            
            <Typography variant="body2" color="text.secondary">
              {isSearchMode 
                  ? `Showing ${rows.length} search results` 
                  : `Showing ${rows.length} items • Page ${page + 1} of ${totalPages}`}
            </Typography>
            
            {!isSearchMode && totalPages > 1 && (
              <Pagination 
                count={totalPages} 
                page={page + 1} 
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
                siblingCount={isMobile ? 0 : 1}
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 500,
                  },
                  '& .Mui-selected': {
                    fontWeight: 700,
                  }
                }}
              />
            )}
            
            {/* Reset View - only in search mode */}
            {isSearchMode && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleClearSearch}
                size={isMobile ? "small" : "medium"}
                sx={{ borderRadius: 1.5, minWidth: 120 }}
              >
                View All Parts
              </Button>
            )}
          </Box>
          
          {isMobile && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 1.5,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                }}
              >
                <span>←</span>Swipe horizontally to view all columns<span>→</span>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Paper
          elevation={3} 
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            p: 1.5,
            backgroundColor: theme.palette.error.main,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">{error}</Typography>
            <IconButton size="small" color="inherit" onClick={() => setError(null)}>
              <span>×</span>
            </IconButton>
          </Box>
        </Paper>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!deleteSuccess}
        autoHideDuration={3000}
        onClose={() => setDeleteSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Paper
          elevation={3}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            p: 1.5,
            backgroundColor: theme.palette.success.main,
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">{deleteSuccess}</Typography>
            <IconButton size="small" color="inherit" onClick={() => setDeleteSuccess(null)}>
              <span>×</span>
            </IconButton>
          </Box>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default UserPartList;