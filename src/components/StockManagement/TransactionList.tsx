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
import { useNavigate } from 'react-router-dom';
import apiClient from 'utils/apiClient';

// Interfaces and types
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

// Constants for configuration
const PAGE_SIZE = 50;
const MAX_SEARCH_PAGES = 3;
const LOW_STOCK_THRESHOLD = 2;
const SCROLL_THRESHOLD = 200; // px from bottom to trigger loading
const RETRY_DELAY = 3000; // ms to wait before retrying a failed request
const MAX_RETRIES = 3; // maximum number of retries for a failed request
const ERROR_DISPLAY_DURATION = 5000; // ms to display error messages

const UserPartList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Core state variables
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  
  // Pagination and data stats
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle resize events for responsive layout
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

  // Clean up any timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Helper function to format part data consistently
  const formatPartData = (part: UserPart) => ({
    id: part.userPartId,
    partNumber: part.partNumber || "",
    partName: part.partName || "",
    description: part.description || "",
    manufacturer: part.manufacturer || "",
    quantity: part.quantity || 0,
    price: part.price || 0,
    buyingPrice: part.buyingPrice || 0,
    gst: part.gst || 18,
  });

  // Fetch a single page of user parts with error handling
  const fetchUserPartsPage = useCallback(async (pageNumber: number) => {
    // Prevent duplicate fetches
    if (loadingRef.current) {
      return;
    }
    
    // Set loading state
    setLoading(true);
    
    // Track loading state in ref
    loadingRef.current = true;
    
    try {
      console.log(`Fetching page ${pageNumber} with size ${PAGE_SIZE}`);
      
      // Make API call
      const response = await apiClient.get<PaginatedResponse<UserPart>>('/userParts/getAll', {
        params: { page: pageNumber, size: PAGE_SIZE },
        timeout: 30000,
      });
      
      // Process the response
      const { content, totalPages, totalElements, currentPage } = response.data;
      
      console.log(`Received ${content.length} items for page ${currentPage}, total pages: ${totalPages}`);
      
      // Format received data
      const formattedRows = content.map(formatPartData);
      
      // Update pagination info
      setTotalElements(totalElements);
      setTotalPages(totalPages);
      setPage(currentPage);
      
      // Always replace all rows
      setRows(formattedRows);
      
      // Calculate low stock items
      const lowStock = formattedRows.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD).length;
        setLowStockCount(lowStock);
      
      // Clear error state
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
      // Reset loading states
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Add a new function to handle page changes
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    // Pages are 0-indexed in the API but 1-indexed in the Pagination component
    fetchUserPartsPage(value - 1);
  }, [fetchUserPartsPage]);

  // Initial load - page 0
  useEffect(() => {
    fetchUserPartsPage(0);
  }, [fetchUserPartsPage]);

  // Handle search functionality
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
      
      // For search, we'll download a limited set of data
      const searchResults: UserPart[] = [];
      
      // Only search first few pages
      for (let i = 0; i < MAX_SEARCH_PAGES; i++) {
        try {
          const response = await apiClient.get<PaginatedResponse<UserPart>>('/userParts/getAll', {
            params: { page: i, size: PAGE_SIZE },
            timeout: 30000,
          });
          
          const { content, totalElements, totalPages } = response.data;
          
          // Set pagination info from first page
          if (i === 0) {
            setTotalElements(totalElements);
            setTotalPages(totalPages);
          }
          
          // Break if no content or at end
          if (!content.length) break;
          
          searchResults.push(...content);
          
          // Break if we've fetched all pages or reached limit
          if (i >= totalPages - 1 || i >= MAX_SEARCH_PAGES - 1) break;
        } catch (err) {
          console.error(`Error fetching search page ${i}:`, err);
          break;
        }
      }
      
      // Filter results
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredResults = searchResults.filter(part => 
        (part.partNumber && part.partNumber.toLowerCase().includes(lowerSearchTerm)) ||
        (part.partName && part.partName.toLowerCase().includes(lowerSearchTerm)) ||
        (part.description && part.description.toLowerCase().includes(lowerSearchTerm)) ||
        (part.manufacturer && part.manufacturer.toLowerCase().includes(lowerSearchTerm))
      );
      
      const formattedResults = filteredResults.map(formatPartData);
      
      // Update state with search results
      setRows(formattedResults);
      
      // Count low stock in search results
      const lowStock = formattedResults.filter(item => Number(item.quantity) < LOW_STOCK_THRESHOLD).length;
      setLowStockCount(lowStock);
      
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
  }, [fetchUserPartsPage, searchText]);

  // Handle search button click
  const handleSearchClick = () => {
    handleSearch(searchText);
  };

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchText("");
    setIsSearchMode(false);
    setRows([]);
    setPage(0);
    fetchUserPartsPage(0);
  };

  // Define columns for the DataGrid
  const getColumns = (): GridColDef[] => {
    // Adjust base column width for better mobile display
    const baseColumnWidth = isMobile ? 80 : 130;
    
    const columns: GridColDef[] = [
    {
        field: 'actions',
        headerName: 'Actions',
        width: isMobile ? 70 : 90,
        minWidth: 70,
        flex: 0, // Use fixed width instead of flex
        sortable: false,
        filterable: false,
        renderCell: (params: GridCellParams) => (
          <Stack direction="row" alignItems="center" justifyContent="center">
            <Tooltip title="View Details">
              <IconButton
                color="primary"
                onClick={() => navigate(`/admin/user-part/view/${params.row.id}`)}
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
          </Stack>
        ),
        renderHeader: renderHeaderWithTooltip,
    },
    {
        field: 'id',
        headerName: 'Sr.No',
        width: isMobile ? 50 : 80,
        minWidth: 50,
        flex: 0, // Use fixed width instead of flex
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
    },
    {
        field: 'partName',
        headerName: 'Spare Name',
        width: isMobile ? baseColumnWidth : baseColumnWidth * 1.2,
        minWidth: 80,
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
        minWidth: 80,
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

    // Add partNumber only for non-mobile view
    if (!isMobile) {
      columns.push({
        field: 'partNumber',
        headerName: 'Part Number',
        width: baseColumnWidth,
        minWidth: 100,
        flex: 0.8,
        sortable: false,
        renderHeader: renderHeaderWithTooltip,
      });
    }

    // Add the rest of the columns
    columns.push(
    {
        field: 'buyingPrice',
        headerName: 'Purchase Rate',
        width: isMobile ? 80 : 120,
        minWidth: 80,
        flex: 0, // Use fixed width
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
        width: isMobile ? 70 : 110,
        minWidth: 70,
        flex: 0, // Use fixed width
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
        width: isMobile ? 60 : 80,
        minWidth: 60,
        flex: 0, // Use fixed width
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
        width: isMobile ? 70 : 100,
        minWidth: 70,
        flex: 0, // Use fixed width
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
        width: isMobile ? 120 : 170,
        minWidth: 110,
        flex: 0, // Use fixed width
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

  // Improve the header renderer to prevent cut-offs
  const renderHeaderWithTooltip = (params: GridColumnHeaderParams) => {
    if (!params || !params.colDef) {
      return <span>Unknown</span>;
    }

    const headerName = params.colDef.headerName || '';
    
    // For mobile, split long headers into multiple lines
    if (isMobile && headerName.includes(' ')) {
      const words = headerName.split(' ');
      
      return (
        <Tooltip title={headerName}>
          <Box sx={{ 
            lineHeight: 1.3, 
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.75rem',
            padding: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {words.map((word, index) => (
              <div key={index} style={{ width: '100%' }}>{word}</div>
            ))}
          </Box>
        </Tooltip>
      );
    }
    
    // For desktop or single-word headers
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
        }}>
          {headerName}
        </Box>
      </Tooltip>
    );
  };

  // Helper to handle error display
  const handleApiError = (err: any, customMessage?: string) => {
    console.error("API Error:", err);
    
    let errorMessage = customMessage || 'Failed to load data. Please try again.';
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Loading will continue automatically.';
    } else if (err.response) {
      // Handle specific HTTP error codes
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
    
    // Auto-hide error after delay, but only for timeout errors
    if (err.code === 'ECONNABORTED') {
      setTimeout(() => {
        setError(null);
      }, ERROR_DISPLAY_DURATION);
    }
    
    return errorMessage;
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
                        size={isMobile ? "small" : "medium"}
                        startIcon={<InventoryIcon />}
                        onClick={() => navigate('/admin/transaction/add')}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Add Part
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
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
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
                minWidth: isMobile ? '600px' : 'auto', // Increased to ensure all columns fit
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
                      height: isMobile ? '60px !important' : '60px !important',
                      maxHeight: isMobile ? '60px !important' : '60px !important',
                      lineHeight: 1.3,
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
                    },
                    '& .MuiDataGrid-columnHeader': {
                      padding: isMobile ? '4px' : '8px',
                      outline: 'none !important',
                    },
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      padding: 0,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
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
          <Alert 
          onClose={() => setError(null)} 
          severity="error" 
            sx={{ width: '100%', borderRadius: 2 }}
          >
          {error}
          </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPartList;