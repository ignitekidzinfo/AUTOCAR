import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import apiClient from "Services/apiService";
import {
  Grid,
  Box,
  Typography,
  Button,
  OutlinedInput,
  FormLabel,
  styled,
  Stack,
  Snackbar,
  Alert,
  TextField,
  IconButton,
  InputAdornment,
  Paper,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import CustomizedDataGrid from "components/CustomizedDataGrid";
import { GridCellParams, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import SparePartDeleteModel from "./SparePartDeleteModel";
import { Task, Description, NoteAdd, ErrorOutline } from "@mui/icons-material";

const CACHE_KEY_PREFIX = 'vehicle_parts_';
const CACHE_DURATION = 5 * 60 * 1000;
const memoryCache = new Map();

const FormGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(2),
}));
const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  borderRadius: theme.shape.borderRadius,
  transition: "transform 0.3s, box-shadow 0.3s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: 120,
  width: '100%',
  boxShadow: theme.shadows[2],
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[4],
  },
}));

interface CreateTransaction {
  vehicleRegId?: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: number;
  amount: number;
  total: number;
  transactionType: string;
  billNo: number;
  sparePartTransactionId: number;
  cgst: number;
  sgst: number;
}
const initialCreateData: CreateTransaction = {
  vehicleRegId: undefined,
  partNumber: "",
  partName: "",
  manufacturer: "",
  quantity: 1,
  amount: 0,
  total: 0,
  transactionType: "DEBIT",
  billNo: 1,
  sparePartTransactionId: 0,
  cgst: 0,
  sgst: 0,
};
interface SpareFilterDto {
  sparePartId: number;
  partName: string;
  manufacturer: string;
  description: string;
  partNumber: string;
  price?: number;
  cgst: number;
  sgst: number;
}
interface Feedback {
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

const getCachedData = <T,>(key: string): T | null => {
  try {
    const memoryCached = memoryCache.get(key);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
      return memoryCached.data as T;
    }
    
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
    
        memoryCache.set(key, {data: data.data, timestamp: Date.now()});
        return data.data as T;
      }
    }
  } catch (e) {
    console.error('Error reading cache:', e);
 
    try {
      localStorage.removeItem(key);
      memoryCache.delete(key);
    } catch {
    }
  }
  return null;
};

const saveToCache = <T,>(key: string, data: T): void => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    memoryCache.set(key, {data, timestamp: Date.now()});
    
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Error saving to cache:', e);
  }
};

const AddVehiclePartService: React.FC = () => {
  const [createData, setCreateData] = useState<CreateTransaction>(initialCreateData);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [partSuggestions, setPartSuggestions] = useState<SpareFilterDto[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<string>("spare");
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [realVehicleId, setRealVehicleId] = useState<string | null>(null);
  const [isPendingId, setIsPendingId] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 
  
  useEffect(() => {
    if (id && id.toString().startsWith('pending-')) {
      setIsPendingId(true);
      
      const storedRealId = sessionStorage.getItem('realVehicleId');
      if (storedRealId) {
        setRealVehicleId(storedRealId);
        window.history.replaceState(
          null,
          '',
          location.pathname.replace(id, storedRealId)
        );
      } else {
        const checkRealIdInterval = setInterval(() => {
          const updatedRealId = sessionStorage.getItem('realVehicleId');
          if (updatedRealId) {
            setRealVehicleId(updatedRealId);
            clearInterval(checkRealIdInterval);
            window.history.replaceState(
              null,
              '',
              location.pathname.replace(id, updatedRealId)
            );
          }
        }, 1000); 
        
        return () => clearInterval(checkRealIdInterval);
      }
    }
  }, [id, location.pathname]);
  
  const getEffectiveVehicleId = useCallback(() => {
    return isPendingId && realVehicleId ? realVehicleId : id;
  }, [isPendingId, realVehicleId, id]);

  const fetchSparePartList = useCallback(async (skipCache = false) => {
    const effectiveId = getEffectiveVehicleId();
    
    if (isPendingId && !realVehicleId) {
      console.log("Waiting for real vehicle ID before fetching spare parts");
      return;
    }

    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    if (!skipCache) {
      const cacheKey = `${CACHE_KEY_PREFIX}${effectiveId}`;
      const cachedData = getCachedData<GridRowsProp>(cacheKey);
      
      if (cachedData && cachedData.length > 0) {
        setRows(cachedData);
        loadingRef.current = false;
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const responsePart = await apiClient.get(
        `/sparePartTransactions/vehicleRegId?vehicleRegId=${effectiveId}` );
      if (!responsePart.data || responsePart.data.length === 0) {
        console.warn("No transactions found for this vehicleRegId");
        setRows([]);
        loadingRef.current = false;
        setIsLoading(false);
        return; 
      }
      
      const transactions: any = Array.isArray(responsePart.data)
        ? responsePart.data
        : [responsePart.data];
      const transactionsData = transactions[0].data;
      const newTransactions = transactionsData.map((resData: any, index: number) => ({
        id: index + 1, 
        partNumber: resData.partNumber,
        partName: resData.partName,
        manufacturer: resData.manufacturer,
        quantity: resData.quantity,
        amount: resData.price || 0,
        total: (resData.price || 0) * resData.quantity,
        transactionType: resData.transactionType,
        vehicleRegId: resData.vehicleRegId,
        sparePartTransactionId: resData.sparePartTransactionId,
        cgst: resData.cgst || 0,
        sgst: resData.sgst || 0, 
      }));
      
      setRows(newTransactions);
      
      const cacheKey = `${CACHE_KEY_PREFIX}${effectiveId}`;
      saveToCache(cacheKey, newTransactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);  
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [getEffectiveVehicleId, realVehicleId]);

  useEffect(() => {
    const effectiveId = getEffectiveVehicleId();
    if (effectiveId) {
      fetchSparePartList();
    }
  }, [getEffectiveVehicleId, fetchSparePartList]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      debounceTimerRef.current = null;
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchKeyword]);

  const fetchPartSuggestions = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setPartSuggestions([]);
      return; 
    }
    
    const cacheKey = `part_suggestions_${keyword}`;
    const cachedSuggestions = getCachedData<SpareFilterDto[]>(cacheKey);
    
    if (cachedSuggestions) {
      setPartSuggestions(cachedSuggestions);
      return;
    }
    
    try {
      const response = await apiClient.get(`/Filter/search?keyword=${keyword}`);
      const suggestions = response.data;
      setPartSuggestions(suggestions);
      
      saveToCache(cacheKey, suggestions);
    } catch (error) {
      console.error("Error fetching part suggestions:", error); 
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      fetchPartSuggestions(debouncedSearch);
    }
  }, [debouncedSearch, fetchPartSuggestions]);

  const handleCreateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCreateData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
      total:
        name === "amount"
          ? Number(value) * prev.quantity
          : name === "quantity"
          ? prev.amount * Number(value)
          : prev.total,  
    })); 
  };

  const handleSelectSuggestion = (suggestion: SpareFilterDto) => {
    setCreateData((prev) => ({
      ...prev,
      partName: suggestion.partName,
      partNumber: suggestion.partNumber,
      manufacturer: suggestion.manufacturer,
      amount: suggestion.price || 0,
      total: (suggestion.price || 0) * prev.quantity,
      cgst: suggestion.cgst,
      sgst: suggestion.sgst,
    }));
    setSearchKeyword("");
    setPartSuggestions([]); 
  };

  const handleClearSelection = () => {
    setCreateData((prev) => ({
      ...prev,
      partName: "",
      partNumber: "",
      manufacturer: "",
      amount: 0,
      total: 0,
      cgst: 0,
      sgst: 0,
    }));
    setSearchKeyword(""); 
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveId = getEffectiveVehicleId();
    
    if (isPendingId && !realVehicleId) {
      setFeedback({
        message: "Please wait until vehicle registration is complete before adding parts",
        severity: "error"
      });
      return;
    }
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const updatedData = {
        ...createData,
        vehicleRegId: Number(effectiveId),
        userId: null,
      };
      const response = await apiClient.post("/sparePartTransactions/add", updatedData);
      const sparePartTransactionId = response.data?.data?.sparePartTransactionId;
      const newTransaction = {
        id: rows.length + 1,
        partNumber: updatedData.partNumber,
        partName: updatedData.partName,
        manufacturer: updatedData.manufacturer,
        quantity: updatedData.quantity,
        amount: updatedData.amount,
        total: updatedData.total,
        transactionType: updatedData.transactionType,
        vehicleRegId: updatedData.vehicleRegId,
        sparePartTransactionId,
        cgst: updatedData.cgst,
        sgst: updatedData.sgst,
      };
      
      const newRows = [...rows, newTransaction];
      setRows(newRows);
      
      const cacheKey = `${CACHE_KEY_PREFIX}${effectiveId}`;
      saveToCache(cacheKey, newRows);
      
      setFeedback({
        message: response.data.message || "Transaction created successfully",
        severity: "success",
      });
      setCreateData(initialCreateData);
    } catch (error: any) {
      console.error("Transaction error:", error.response?.data);
      
      const errorData = error.response?.data;
      if (errorData?.exception && 
          (errorData.exception.includes("Insufficient stock") || 
           errorData.exception.includes("stock"))) {
        setErrorMessage(errorData.exception);
        setErrorDialogOpen(true);
      } else {
        setFeedback({
          message: errorData?.message || errorData?.exception || "Failed to create transaction",
          severity: "error",
        });
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setFeedback(null); 
  };

  const handleDelete = useCallback((id: number) => {
    setSelectedId(id);
    setOpen(true); 
  }, []);

  const handleDeleteConfirmed = useCallback((id: number) => {
    const newRows = rows.filter((row) => row.sparePartTransactionId !== id);
    setRows(newRows);
    
    const effectiveId = getEffectiveVehicleId();
    const cacheKey = `${CACHE_KEY_PREFIX}${effectiveId}`;
    saveToCache(cacheKey, newRows);
  }, [rows, getEffectiveVehicleId]);

  const renderActionButtons = useCallback((params: GridCellParams) => {
    return (
      <IconButton
        color="secondary"
        onClick={(e) => {
          e.stopPropagation();  
          handleDelete(params.row.sparePartTransactionId as number);
        }} >
        <DeleteIcon />
      </IconButton> 
    );
  }, [handleDelete]);

  const computeGstAmounts = useCallback((row: any) => {
    const base = row.total;
    const cgstAmount = (base * row.cgst) / 100;
    const sgstAmount = (base * row.sgst) / 100;
    return { cgstAmount, sgstAmount }; 
  }, []);

  const columns = useMemo<GridColDef[]>(() => [
    { field: "id", headerName: "ID", width: 80, sortable: false },
    { field: "partNumber", headerName: "Part Number", width: 150, sortable: false },
    { field: "partName", headerName: "Part Name", width: 200, sortable: false },
    { field: "manufacturer", headerName: "Manufacturer", width: 200, sortable: false },
    { field: "quantity", headerName: "Quantity", width: 120, sortable: false },
    { field: "amount", headerName: "Amount", width: 150, sortable: false },
    { field: "cgst", headerName: "CGST (%)", width: 120, sortable: false },
    {
      field: "cgstAmount",
      headerName: "CGST Amt",
      width: 120,
      sortable: false,
      valueGetter: (params: any) => {
        if (!params?.row) return "";
        const { cgstAmount } = computeGstAmounts(params.row);
        return cgstAmount ? cgstAmount.toFixed(2) : "0.00"; 
      }, 
    },
    { field: "sgst", headerName: "SGST (%)", width: 120, sortable: false },
    {
      field: "sgstAmount",
      headerName: "SGST Amt",
      width: 120,
      sortable: false,
      valueGetter: (params: any) => {
        if (!params?.row) return "";
        const { sgstAmount } = computeGstAmounts(params.row);
        return sgstAmount ? sgstAmount.toFixed(2) : "0.00"; 
      }, 
    },
    { field: "total", headerName: "Total", width: 150, sortable: false },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      renderCell: renderActionButtons, 
    }, 
  ], [computeGstAmounts, renderActionButtons]);

  const grandTotal = useMemo(() => 
    rows.reduce((acc, row) => acc + (row.total as number), 0),
    [rows]
  );

  const renderHeaderCards = useCallback(() => {
    const headerCards = [
      {
        label: "Job Card",
        icon: <Task fontSize="large" color="primary" />,
        value: "jobCard",
        onClick: () => navigate(`/admin/job-card/${getEffectiveVehicleId()}`),
      },
      {
        label: "Spare",
        icon: <Description fontSize="large" color="primary" />,
        value: "spare",
        onClick: () => setCurrentTab("spare"),
      },
      {
        label: "Service",
        icon: <NoteAdd fontSize="large" color="primary" />,
        value: "service",
        onClick: () => navigate(`/admin/serviceTab/${getEffectiveVehicleId()}`),
      },
    ];

    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '900px', mx: 'auto' }}>
          {headerCards.map((card) => (
            <Grid item xs={12} sm={4} md={4} key={card.value}>
              <HeaderCard 
                onClick={card.onClick}
                sx={{
                  border: currentTab === card.value ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  backgroundColor: currentTab === card.value ? 'rgba(25, 118, 210, 0.08)' : 'white',
                }}
              >
                <Box sx={{ mb: 1 }}>{card.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {card.label}
                </Typography>
              </HeaderCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }, [currentTab, getEffectiveVehicleId, navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: "100%",
        p: 2,
        backgroundColor: "#f9f9f9",
      }} >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="textSecondary">
          Vehicle Registration ID: {getEffectiveVehicleId()}
          {isPendingId && !realVehicleId && (
            <Typography component="span" color="warning.main" sx={{ ml: 1, fontStyle: 'italic' }}>
              (Processing vehicle registration...)
            </Typography>
          )}
        </Typography>
      </Box>
      
      {renderHeaderCards()}
      
      {currentTab === "spare" && (<>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#fff",
              borderRadius: 3,
              boxShadow: 1,
              width: "100%", }} >
            <Typography
              component="h2"
              variant="h6"
              sx={{ fontWeight: 600, display: "flex", alignItems: "center" }} >
              Add Vehicle Service Parts
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Stack>
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, width: "100%" }}>
            <form onSubmit={handleCreateSubmit}>
              <Grid container spacing={2}>
                <FormGrid item xs={12} sm={6}>
                  <FormLabel htmlFor="partName" sx={{ mb: 1 }}>
                    Part Name (Type & Search)
                  </FormLabel>
                  {createData.partName && createData.manufacturer ? (
                    <OutlinedInput
                      value={`${createData.partName} - ${createData.manufacturer}`}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton onClick={handleClearSelection}>
                            <CancelIcon />
                          </IconButton>
                        </InputAdornment> } 
                      size="small"
                      fullWidth
                      disabled  />  ) : ( <>
                      <TextField
                        name="partName"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Type to search spare parts..."
                        variant="outlined"
                        size="small"
                        fullWidth  />
                      {partSuggestions.length > 0 && (
                        <Box
                          sx={{
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            mt: 1,
                            maxHeight: 200,
                            overflowY: "auto",
                            backgroundColor: "#fff",  }}  >
                          {partSuggestions.map((suggestion) => (
                            <Box
                              key={suggestion.sparePartId}
                              sx={{
                                p: 1,
                                cursor: "pointer",
                                "&:hover": { backgroundColor: "#f0f0f0" },
                              }}
                              onClick={() => handleSelectSuggestion(suggestion)} >
                              {suggestion.manufacturer} - {suggestion.partName} - {suggestion.description} <br />
                              <small>
                                CGST: {suggestion.cgst}% | SGST: {suggestion.sgst}%
                              </small>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </FormGrid>
                <FormGrid item xs={12} sm={6}>
                  <FormLabel htmlFor="partNumber" sx={{ mb: 1 }}>
                    Part Number
                  </FormLabel>
                  <OutlinedInput
                    name="partNumber"
                    value={createData.partNumber}
                    onChange={handleCreateChange}
                    placeholder="Auto-filled Part Number"
                    size="small"
                    required
                    disabled
                  />
                </FormGrid>
                <FormGrid item xs={12} sm={6}>
                  <FormLabel htmlFor="quantity" sx={{ mb: 1 }}>
                    Quantity
                  </FormLabel>
                  <OutlinedInput
                    name="quantity"
                    value={createData.quantity}
                    onChange={handleCreateChange}
                    type="number"
                    size="small"
                    required
                    inputProps={{ min: 1 }}
                  />
                </FormGrid>
                <FormGrid item xs={12} sm={6}>
                  <FormLabel htmlFor="amount" sx={{ mb: 1 }}>
                    Amount
                  </FormLabel>
                  <OutlinedInput
                    name="amount"
                    value={createData.amount}
                    onChange={handleCreateChange}
                    type="number"
                    size="small"
                    required
                  />
                </FormGrid>
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Transaction"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
          {rows.length !== 0 && (
            <>
              <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 3, width: "100%" }}>
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <CustomizedDataGrid 
                    columns={columns} 
                    rows={rows} 
                    autoHeight 
                    disableColumnMenu
                    density="standard"
                    getRowHeight={() => 'auto'}
                    disableRowSelectionOnClick
                  />
                </Box>
              </Paper>
              <Paper elevation={3} sx={{ p: 2, textAlign: "right", borderRadius: 3, width: "100%" }}>
                <Typography variant="h6">Grand Total: {grandTotal}</Typography>
              </Paper>
            </>
          )}
        </>
      )}
      {currentTab === "service" && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, width: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Service Content
          </Typography>
        </Paper>
      )}
      {currentTab === "serviceQueue" && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3, width: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Service Queue Content
          </Typography>
        </Paper>
      )}
      <SparePartDeleteModel
        open={open}
        onClose={() => setOpen(false)}
        deleteItemId={selectedId}
        onDelete={handleDeleteConfirmed}
      />
      <Dialog 
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '400px',
            maxWidth: '90vw',
          }
        }}
      >
        <DialogTitle id="error-dialog-title" sx={{ 
          backgroundColor: '#ffebee', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center">
            <ErrorOutline sx={{ color: '#d32f2f', mr: 1 }} />
            <Typography variant="h6" component="div" color="error">
              Insufficient Stock
            </Typography>
          </Box>
          <IconButton 
            aria-label="close" 
            onClick={() => setErrorDialogOpen(false)}
            sx={{ color: '#d32f2f' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body1" sx={{ py: 1 }}>
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => setErrorDialogOpen(false)}
            sx={{ minWidth: '120px', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {feedback && (
        <Snackbar
          open={!!feedback}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={feedback.severity} sx={{ width: "100%" }}>
            {feedback.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default React.memo(AddVehiclePartService);
