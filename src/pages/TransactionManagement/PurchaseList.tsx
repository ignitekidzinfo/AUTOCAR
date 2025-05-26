import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  IconButton,
  Breadcrumbs,
  Link,
  styled,
  CircularProgress,
  InputAdornment,
  TablePagination,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiClient from '../../Services/apiService';
import { useNavigate } from 'react-router-dom';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.common.black,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const SearchTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 20,
    '& fieldset': {
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderWidth: 2,
    },
  },
});

interface Bill {
  billId: number;
  billNo: string;
  billDate: string;
  vendorName: string;
  vendorId?: number;
  totalQuantity: number;
  grandTotal: number;
  items?: any[];
}

// Enhanced cache implementation with state management
const CACHE_KEY = 'purchase_bills_cache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds
const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  data: Bill[];
  timestamp: number;
  etag?: string; // For conditional requests
}

const PurchaseList: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ message: string; severity: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Add refs to track last fetch time and etag for conditional requests
  const lastFetchTimeRef = useRef<number>(0);
  const etagRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data with strategic caching
  const fetchBills = useCallback(async (skipCache = false) => {
    try {
      // Throttle API calls - don't fetch more than once every 10 seconds unless forced
      const now = Date.now();
      if (!skipCache && now - lastFetchTimeRef.current < 10000) {
        console.log('Throttling API call - too frequent');
        return;
      }
      
      // First check for cached data if not explicitly skipping cache
      if (!skipCache) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedCache: CacheData = JSON.parse(cachedData);
          const isExpired = now - parsedCache.timestamp > CACHE_EXPIRY;
          
          if (!isExpired) {
            console.log('Using cached bill data for initial render');
            setBills(parsedCache.data);
            setLoading(false);
            
            // If cache is relatively fresh (less than 2 minutes old), don't fetch again
            if (now - parsedCache.timestamp < 120000) {
              return;
            }
            
            // Store etag for conditional request
            if (parsedCache.etag) {
              etagRef.current = parsedCache.etag;
            }
            
            // Otherwise, continue to fetch in background for updates
            console.log('Cache available but checking for updates in background');
          }
        }
      }

      // If skipCache is true or cache expired/not available, show loading state
      if (skipCache) {
        setLoading(true);
      } else {
        // For background refresh, don't show loading state
        setRefreshing(true);
      }
      
      // Prepare headers for conditional request
      const headers: Record<string, string> = {};
      if (etagRef.current && !skipCache) {
        headers['If-None-Match'] = etagRef.current;
      }
      
      // Update last fetch time
      lastFetchTimeRef.current = now;
      
      // Make API request with conditional headers
      const response = await apiClient.get('/bills/all', { headers });
      
      // Check if we got a 304 Not Modified response
      if (response.status === 304) {
        console.log('Server returned 304 Not Modified, using cached data');
        setRefreshing(false);
        setLoading(false);
        return;
      }
      
      // Store new etag if provided
      const newEtag = response.headers?.etag;
      if (newEtag) {
        etagRef.current = newEtag;
      }
      
      if (response.data && response.data.data) {
        // Process bills to get total quantity
        const processedBills = response.data.data.map((bill: any) => ({
          billId: bill.billId,
          billNo: bill.billNo,
          billDate: new Date(bill.billDate).toLocaleDateString('en-GB'),
          vendorName: bill.vendorName,
          vendorId: bill.vendorId,
          totalQuantity: bill.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0,
          grandTotal: bill.grandTotal || 0
        }));
        
        // Check if data has changed compared to what we're currently showing
        const currentBills = bills;
        const hasDataChanged = currentBills.length !== processedBills.length || 
          JSON.stringify(currentBills.map((b: Bill) => b.billId).sort()) !== 
          JSON.stringify(processedBills.map((b: Bill) => b.billId).sort());
        
        if (hasDataChanged) {
          console.log('Data has changed, updating view');
          // Update state with new data
          setBills(processedBills);
          
          // If data changed and we weren't showing loading indicator, show a success message
          if (!skipCache && currentBills.length > 0) {
            setFeedback({
              message: "Purchase list updated with latest data",
              severity: "info"
            });
          }
        } else {
          console.log('No changes in data detected');
        }
        
        // Always update the cache with latest data and etag
        const cacheData: CacheData = {
          data: processedBills,
          timestamp: now,
          etag: newEtag || etagRef.current
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      if (skipCache) {
        // Only show error if we were explicitly fetching (not background)
        setFeedback({
          message: "Failed to load purchase data",
          severity: "error"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // No dependencies to prevent re-creation

  // Initial load - try to use cache first
  useEffect(() => {
    fetchBills(false);
    
    // Set up periodic background refresh with smart scheduling
    const scheduleNextRefresh = () => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Schedule next refresh
      refreshTimerRef.current = setTimeout(() => {
        console.log('Performing background refresh');
        fetchBills(false).finally(() => {
          // Schedule next refresh when this one completes
          scheduleNextRefresh();
        });
      }, BACKGROUND_REFRESH_INTERVAL);
    };
    
    // Start the refresh cycle
    scheduleNextRefresh();
    
    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchBills]);

  // Add event listener for visibility changes to optimize API calls
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User has returned to the tab, check if we need a refresh
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedCache: CacheData = JSON.parse(cachedData);
          const timeSinceLastUpdate = Date.now() - parsedCache.timestamp;
          
          // If cache is older than 1 minute and we haven't fetched recently, refresh
          if (timeSinceLastUpdate > 60000 && Date.now() - lastFetchTimeRef.current > 30000) {
            console.log('Tab became visible, refreshing data');
            fetchBills(false);
          }
        }
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchBills]);

  // Add a manual refresh function that forces a refresh
  const handleManualRefresh = () => {
    fetchBills(true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = async (billId: number) => {
    try {
      // Show loading state
      setLoading(true);
      
      // Get detailed bill data for editing
      const response = await apiClient.get(`/bills/printData/${billId}`);
      
      if (response.data && response.data.data) {
        const billData = response.data.data;
        
        // Store the bill data in sessionStorage for the edit page
        sessionStorage.setItem('editBillData', JSON.stringify(billData));
        
        // Add a flag to indicate this is an edit operation to handle HTTP method correctly
        sessionStorage.setItem('isEditOperation', 'true');
        
        // Navigate to transaction add page with the bill ID
        navigate(`/admin/transaction?edit=${billId}`);
      }
    } catch (error) {
      console.error('Error fetching bill details for edit:', error);
      setFeedback({
        message: "Failed to load bill data for editing",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (billId: number) => {
    try {
      // Get bill data for printing
      const response = await apiClient.get(`/bills/printData/${billId}`);
      if (response.data && response.data.data) {
        // Open print preview or generate PDF
        // This could be implemented using a PDF library like jsPDF
        console.log('Print bill:', response.data.data);
        
        // Example: Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const bill = response.data.data;
          printWindow.document.write(`
            <html>
              <head>
                <title>Bill #${bill.billNo}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 10px; font-size: 11px; }
                  .header { text-align: center; margin-bottom: 10px; }
                  .bill-info { display: flex; justify-content: space-between; margin-bottom: 5px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                  th, td { border: 1px solid #000; padding: 3px 4px; text-align: left; font-size: 10px; }
                  th { background-color: #f2f2f2; text-align: center; font-size: 10px; }
                  .total-row { font-weight: bold; }
                  .title { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
                  .subtitle { font-size: 14px; font-weight: bold; margin: 5px 0; }
                  .address { font-size: 11px; margin: 2px 0; }
                  .contact { font-size: 11px; margin: 2px 0; }
                  .separator-line { border-bottom: 1px solid #000; margin: 5px 0; }
                  .date-section { text-align: right; }
                  .amt-column { text-align: right; }
                  .qty-column { text-align: center; }
                  .rate-column { text-align: right; }
                  .gst-column { text-align: center; }
                  @media print {
                    @page { margin: 0.5cm; }
                    body { font-size: 11px; }
                    th, td { padding: 2px 4px; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="title">${bill.shopName || 'Auto Car Care Point'}</div>
                  <div class="address">${bill.shopAddress || 'Buvasaheb Nagar, Shingnapur Road, Kolki, Phaltan, Tal.Phaltan(415523), Dist.Satara.'}</div>
                  <div class="contact">Contact No : ${bill.shopContact || '9767102794'}</div>
                  <div class="separator-line" style="margin: 3px 0;"></div>
                  <div class="subtitle">PURCHASE BILL</div>
                  <div class="separator-line" style="margin: 3px 0;"></div>
                </div>
                <div class="bill-info">
                  <div>
                    <span><strong>Bill NO:</strong> ${bill.billNo}</span>
                  </div>
                  <div class="date-section">
                    <span><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
                <div class="separator-line"></div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 5%;">Sr</th>
                      <th style="width: 40%;">Item</th>
                      <th colspan="2" style="width: 15%;">GST</th>
                      <th style="width: 10%;">Qty</th>
                      <th style="width: 15%;">Rate</th>
                      <th style="width: 15%;">Amt</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th></th>
                      <th style="width: 7.5%;">CGST%</th>
                      <th style="width: 7.5%;">SGST%</th>
                      <th></th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bill.items?.map((item: any, index: number) => `
                      <tr style="height: 18px;">
                        <td style="text-align: center; padding: 2px;">${item.serialNo || index + 1}</td>
                        <td style="padding: 2px 4px;">${item.itemName}</td>
                        <td class="gst-column" style="padding: 2px;">${item.cgstPercentage?.toFixed(1)}%</td>
                        <td class="gst-column" style="padding: 2px;">${item.sgstPercentage?.toFixed(1)}%</td>
                        <td class="qty-column" style="padding: 2px;">${item.quantity}</td>
                        <td class="rate-column" style="padding: 2px;">${item.rate?.toFixed(2)}</td>
                        <td class="amt-column" style="padding: 2px;">${item.amount?.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row" style="height: 18px;">
                      <td colspan="4" style="text-align: right; padding: 2px 4px;">Total</td>
                      <td class="qty-column" style="padding: 2px;">${bill.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0}</td>
                      <td style="padding: 2px;"></td>
                      <td class="amt-column" style="padding: 2px 4px;">${bill.subTotal?.toFixed(2)}</td>
                    </tr>
                    <tr style="height: 18px;">
                      <td colspan="6" style="text-align: right; padding: 2px 4px;">CGST:</td>
                      <td class="amt-column" style="padding: 2px 4px;">${bill.totalCgst?.toFixed(2)}</td>
                    </tr>
                    <tr style="height: 18px;">
                      <td colspan="6" style="text-align: right; padding: 2px 4px;">SGST:</td>
                      <td class="amt-column" style="padding: 2px 4px;">${bill.totalSgst?.toFixed(2)}</td>
                    </tr>
                    <tr style="height: 18px;">
                      <td colspan="6" style="text-align: right; padding: 2px 4px;">Round Off:</td>
                      <td class="amt-column" style="padding: 2px 4px;">${bill.roundOff?.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row" style="height: 18px;">
                      <td colspan="6" style="text-align: right; padding: 2px 4px;">Grand Total:</td>
                      <td class="amt-column" style="padding: 2px 4px;">${bill.grandTotal?.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Error printing bill:', error);
    }
  };

  const handleAddNewBill = () => {
    // Clear any previous edit data
    sessionStorage.removeItem('editBillData');
    navigate('/admin/transaction');
  };

  // Filter bills based on search term
  const filteredBills = useMemo(() => {
    return bills.filter(bill => 
      bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bills, searchTerm]);

  // Get current page of bills
  const paginatedBills = useMemo(() => {
    return filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredBills, page, rowsPerPage]);

  // Show a simpler loading indicator
  const renderLoading = () => (
    <TableRow>
      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
        <CircularProgress size={30} />
      </TableCell>
    </TableRow>
  );

  // Function to delete a spare part transaction
  const deleteSparePartTransaction = async (transactionId: number) => {
    try {
      const response = await apiClient.delete(`/sparePartTransactions/delete?transactionId=${transactionId}`);
      
      if (response.data && response.data.success) {
        setFeedback({
          message: "Part deleted successfully",
          severity: "success"
        });
        return true;
      } else {
        setFeedback({
          message: response.data?.message || "Failed to delete part",
          severity: "error"
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting spare part transaction:', error);
      setFeedback({
        message: "Failed to delete part transaction",
        severity: "error"
      });
      return false;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            underline="hover" 
            color="inherit" 
            href="/" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Purchase
          </Link>
          <Typography color="text.primary">Purchase List</Typography>
        </Breadcrumbs>
        <Typography variant="h6" sx={{ mt: 1 }}>
          Purchase Invoices
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        mb: 2,
        gap: 1
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: '300px' }}
        />
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleManualRefresh}
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
          disabled={refreshing || loading}
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>Sr.No</StyledTableCell>
              <StyledTableCell>Invoice No.</StyledTableCell>
              <StyledTableCell>Inv. Date</StyledTableCell>
              <StyledTableCell>Supplier Name</StyledTableCell>
              <StyledTableCell align="center">Total Qty</StyledTableCell>
              <StyledTableCell align="right">Grand Total</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderLoading()
            ) : paginatedBills.length > 0 ? (
              paginatedBills.map((bill, index) => (
                <StyledTableRow key={bill.billId}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{bill.billNo}</TableCell>
                  <TableCell>{bill.billDate}</TableCell>
                  <TableCell>{bill.vendorName}</TableCell>
                  <TableCell align="center">{bill.totalQuantity}</TableCell>
                  <TableCell align="right">₹{bill.grandTotal.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(bill.billId)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handlePrint(bill.billId)}>
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No bills found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchTerm ? 'Try a different search term' : 'Add your first purchase invoice'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredBills.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setFeedback(null)} 
          severity={feedback?.severity || "info"} 
          sx={{ width: '100%' }}
        >
          {feedback?.message || ""}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseList; 