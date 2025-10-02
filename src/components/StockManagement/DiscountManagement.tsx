import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  CircularProgress,
  styled,
  Checkbox,
  FormGroup,
  FormControlLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Radio,
  RadioGroup,
  InputAdornment
} from '@mui/material';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

// Types
interface DiscountStructureDTO {
  discountId?: number;
  manufacturer: string;
  discount: number;
}

interface ManufacturerDiscount {
  manufacturer: string;
  values: [number | '', number | '', number | ''];
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '14px 16px',
  fontWeight: 'bold',
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[800] 
    : theme.palette.primary.light,
  color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
}));

const StyledTableBodyCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[900] 
      : theme.palette.grey[50],
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 4,
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 'bold',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  minWidth: '80px',
}));

const DiscountManagement: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [discountStructures, setDiscountStructures] = useState<DiscountStructureDTO[]>([]);
  const [manufacturerDiscounts, setManufacturerDiscounts] = useState<ManufacturerDiscount[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingManufacturer, setSavingManufacturer] = useState<string | null>(null);
  const [currentEditDiscount, setCurrentEditDiscount] = useState<DiscountStructureDTO | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{open: boolean, discountId?: number}>({
    open: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Utility to normalize manufacturer names for robust comparisons
  const normalizeName = (name: string | undefined | null): string =>
    (name ?? '').toString().trim().toLowerCase();

  // Persist active set change immediately to backend for all manufacturers that already exist
  const handleActiveSetChange = async (index: number) => {
    setActiveSetIndex(index);

    // Persist for each existing discount structure
    try {
      const requests = discountStructures.map(ds =>
        apiClient.patch(`/discounts/active-set/${ds.discountId}/${index}`)
      );
      await Promise.all(requests);
      showSnackbar('Active set updated successfully', 'success');
      // refresh list to pick up active set on DTO
      fetchDiscountStructures();
    } catch (e) {
      showSnackbar('Failed to update active set', 'error');
    }
  };

  // Fetch manufacturers and discount structures on component mount
  useEffect(() => {
    fetchManufacturers();
    fetchDiscountStructures();
  }, []);

  // One-time auto-refresh shortly after initial load to ensure latest active set is reflected
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscountStructures();
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Initialize manufacturer discounts when manufacturers are loaded
  useEffect(() => {
    const initialManufacturerDiscounts: ManufacturerDiscount[] = manufacturers.map(manufacturer => ({
      manufacturer,
      values: ['', '', '']
    }));
    setManufacturerDiscounts(initialManufacturerDiscounts);
  }, [manufacturers.length]);

  // Update manufacturer per-row values when discount structures change (but not when manufacturerDiscounts change to avoid infinite loop)
  useEffect(() => {
    if (discountStructures.length === 0 || manufacturerDiscounts.length === 0) return;

    // Don't update if currently editing to preserve user input
    if (currentEditDiscount) return;

    let changed = false;
    const updated = manufacturerDiscounts.map(item => {
      const ds = discountStructures.find(
        s => normalizeName(s.manufacturer) === normalizeName(item.manufacturer)
      );
      if (!ds) return item;
      const a = (ds as any).discountA ?? (ds as any).discount ?? '';
      const b = (ds as any).discountB ?? (ds as any).discount ?? '';
      const c = (ds as any).discountC ?? (ds as any).discount ?? '';
      const newValues: [number | '', number | '', number | ''] = [a, b, c];
      const same =
        String(item.values[0]) === String(newValues[0]) &&
        String(item.values[1]) === String(newValues[1]) &&
        String(item.values[2]) === String(newValues[2]);
      if (same) return item;
      changed = true;
      return { ...item, values: newValues };
    });

    if (changed) setManufacturerDiscounts(updated);
  }, [discountStructures, currentEditDiscount]); // Removed manufacturerDiscounts from dependencies to prevent infinite loop

  // Set the header activeSetIndex as soon as discount structures arrive (no dependency on manufacturers)
  useEffect(() => {
    if (discountStructures.length === 0) return;
    const indices = discountStructures
      .map(ds => (ds as any).activeSetIndex)
      .filter((v) => v !== undefined && v !== null && v >= 0 && v <= 2);
    if (indices.length > 0 && indices.every(v => v === indices[0])) {
      setActiveSetIndex(indices[0]);
    } else {
      // Default to Box 1 (index 0) instead of -1
      setActiveSetIndex(0);
    }
  }, [discountStructures.length]);

  // (Auto-refresh removed as requested)

  // Fetch all manufacturers
  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/Filter/manufacturers');
      if (response.status === 200) {
        setManufacturers(response.data);
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      showSnackbar('Failed to fetch manufacturers. Please check your connection and try again.', 'error');
      // Remove default values
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all discount structures
  const fetchDiscountStructures = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/discounts/all');
      if (response.status === 200) {
        setDiscountStructures(response.data);
      }
    } catch (error) {
      console.error('Error fetching discount structures:', error);
      showSnackbar('Failed to fetch discount structures. Please check your connection and try again.', 'error');
      setDiscountStructures([]);
    } finally {
      setLoading(false);
    }
  };

  // Update value in one of the three boxes
  const handleValueChange = (manufacturer: string, boxIndex: 0 | 1 | 2, value: string) => {
    const numeric: number | '' = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    const updated = manufacturerDiscounts.map(item => {
      if (item.manufacturer === manufacturer) {
        const newValues: [number | '', number | '', number | ''] = [...item.values] as [number | '', number | '', number | ''];
        newValues[boxIndex] = numeric;
        return {
          ...item,
          values: newValues
        };
      }
      return item;
    });
    setManufacturerDiscounts(updated);
  };

  // Add discount for a manufacturer
  const handleAddDiscount = async (manufacturer: string) => {
    const discountData = manufacturerDiscounts.find(item => item.manufacturer === manufacturer);
    const selected = discountData?.values[activeSetIndex] ?? 0;
    if (!discountData) return;
    // Allow saving values without forcing active set; if none, keep current server active index

    setSavingManufacturer(manufacturer);

    const discountStructure: any = {
      manufacturer: manufacturer,
      discountA: discountData.values[0] === '' ? 0 : Number(discountData.values[0]),
      discountB: discountData.values[1] === '' ? 0 : Number(discountData.values[1]),
      discountC: discountData.values[2] === '' ? 0 : Number(discountData.values[2]),
      activeSetIndex: activeSetIndex
    };
    
    try {
      const response = await apiClient.post('/discounts/add', discountStructure);
      if (response.status === 200) {
        showSnackbar(`Discount added for ${manufacturer}`, 'success');
        fetchDiscountStructures(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding discount:', error);
      showSnackbar(`Failed to add discount for ${manufacturer}`, 'error');
    } finally {
      setSavingManufacturer(null);
    }
  };

  // Handle edit icon click
  const handleEditClick = (discount: DiscountStructureDTO) => {
    setCurrentEditDiscount(discount);
    
    // Find the manufacturer discount entry and update with the current value
    const updatedDiscounts = manufacturerDiscounts.map(item => {
      if (item.manufacturer === discount.manufacturer) {
        return {
          ...item,
          values: [
            (discount as any).discountA ?? discount.discount ?? '',
            (discount as any).discountB ?? discount.discount ?? '',
            (discount as any).discountC ?? discount.discount ?? ''
          ] as [number | '', number | '', number | '']
        };
      }
      return item;
    });
    
    setManufacturerDiscounts(updatedDiscounts);
    showSnackbar(`Select a new discount value for ${discount.manufacturer}`, 'info');
  };

  // Update an existing discount
  const handleUpdateDiscount = async (manufacturer: string) => {
    const discountData = manufacturerDiscounts.find(item => item.manufacturer === manufacturer);
    const existingDiscount = discountStructures.find(d => d.manufacturer === manufacturer);
    const selected = discountData?.values[activeSetIndex] ?? 0;

    if (!discountData || !existingDiscount) {
      showSnackbar('Invalid state. Refresh and try again', 'warning');
      return;
    }
    // Allow updating values without forcing active index selection

    setSavingManufacturer(manufacturer);

    const updatedDiscount: any = {
      discountId: existingDiscount.discountId,
      manufacturer: manufacturer,
      discountA: discountData.values[0] === '' ? 0 : Number(discountData.values[0]),
      discountB: discountData.values[1] === '' ? 0 : Number(discountData.values[1]),
      discountC: discountData.values[2] === '' ? 0 : Number(discountData.values[2]),
      activeSetIndex: activeSetIndex
    };
    
    try {
      const response = await apiClient.patch(`/discounts/${existingDiscount.discountId}`, updatedDiscount);
      if (response.status === 200) {
        showSnackbar(`Discount updated for ${manufacturer}`, 'success');
        setCurrentEditDiscount(null); // Clear edit state first
        fetchDiscountStructures(); // Then refresh the list
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      showSnackbar(`Failed to update discount for ${manufacturer}`, 'error');
    } finally {
      setSavingManufacturer(null);
    }
  };

  // Handle delete icon click
  const handleDeleteClick = (discountId?: number) => {
    if (!discountId) return;
    setDeleteConfirmDialog({
      open: true,
      discountId
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDialog.discountId) return;
    
    try {
      const response = await apiClient.delete(`/discounts/${deleteConfirmDialog.discountId}`);
      if (response.status === 204) {
        showSnackbar('Discount deleted successfully', 'success');
        fetchDiscountStructures(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      showSnackbar('Failed to delete discount', 'error');
    } finally {
      setDeleteConfirmDialog({ open: false });
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Check if manufacturer already has a discount
  const hasExistingDiscount = (manufacturer: string) => {
    return !!discountStructures.find(structure => structure.manufacturer === manufacturer);
  };

  // Get the existing discount structure for a manufacturer (if exists)
  const getExistingDiscount = (manufacturer: string) => {
    return discountStructures.find(structure => structure.manufacturer === manufacturer);
  };

  // Check if a manufacturer is currently being edited
  const isEditing = (manufacturer: string) => {
    return currentEditDiscount?.manufacturer === manufacturer;
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setCurrentEditDiscount(null);
    // Refresh to restore original values
    fetchDiscountStructures();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Manage Discounts
      </Typography>

      <StyledPaper elevation={3}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Set Manufacturer Discounts
        </Typography>
        
        {loading && manufacturers.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : manufacturers.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            No manufacturers found. Please check your connection to the server and try refreshing the page.
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={fetchManufacturers} 
              sx={{ ml: 2 }}
              color="primary"
            >
              Retry
            </Button>
          </Alert>
        ) : (
          <TableContainer sx={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>Active set:</Typography>
              <RadioGroup
                row
                value={String(activeSetIndex)}
                onChange={(e) => handleActiveSetChange(Number(e.target.value))}
              >
                <FormControlLabel value={"0"} control={<Radio />} label="Box 1" />
                <FormControlLabel value={"1"} control={<Radio />} label="Box 2" />
                <FormControlLabel value={"2"} control={<Radio />} label="Box 3" />
              </RadioGroup>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Manufacturer</StyledTableCell>
                  <StyledTableCell align="center">Discount Options</StyledTableCell>
                  <StyledTableCell align="center">Action</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturers.map((manufacturer) => {
                  const discountData = manufacturerDiscounts.find(
                    item => normalizeName(item.manufacturer) === normalizeName(manufacturer)
                  );
                  const values = discountData?.values || ['', '', ''];
                  const isCurrentlyEditing = isEditing(manufacturer);
                  const isActive = (idx: number) => idx === activeSetIndex;
                  
                  return (
                    <StyledTableRow key={manufacturer}>
                      <StyledTableBodyCell>{manufacturer}</StyledTableBodyCell>
                       <StyledTableBodyCell align="center">
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          {[0,1,2].map((idx) => (
                            <TextField
                              key={idx}
                              type="number"
                              size="small"
                          inputProps={{ min: 0, max: 100 }}
                              sx={{
                                width: 110,
                                transition: 'all 200ms ease',
                                opacity: isActive(idx) ? 1 : 0.45,
                                '& .MuiInputBase-input': { textAlign: 'center' }
                              }}
                              value={values[idx] as any}
                              onChange={(e) => handleValueChange(manufacturer, idx as 0|1|2, e.target.value)}
                              placeholder={`Set ${idx+1} %`}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            />
                          ))}
                        </Box>
                      </StyledTableBodyCell>
                      <StyledTableBodyCell align="center">
                        {isCurrentlyEditing ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <StyledButton
                              variant="contained"
                              color="primary"
                              onClick={() => handleUpdateDiscount(manufacturer)}
                              disabled={savingManufacturer === manufacturer}
                              size="small"
                            >
                              {savingManufacturer === manufacturer ? (
                                <CircularProgress size={20} />
                              ) : 'Save'}
                            </StyledButton>
                            <StyledButton
                              variant="outlined"
                              color="secondary"
                              onClick={handleCancelEdit}
                              disabled={savingManufacturer === manufacturer}
                              size="small"
                            >
                              Cancel
                            </StyledButton>
                          </Box>
                        ) : (
                          <StyledButton
                            variant="contained"
                            color="primary"
                            onClick={() => handleAddDiscount(manufacturer)}
                            disabled={savingManufacturer === manufacturer || hasExistingDiscount(manufacturer)}
                          >
                            {savingManufacturer === manufacturer ? (
                              <CircularProgress size={24} />
                            ) : 'Add'}
                          </StyledButton>
                        )}
                      </StyledTableBodyCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>

      <StyledPaper elevation={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Discount Structures
          </Typography>
        </Box>
        
        {loading && discountStructures.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : discountStructures.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            No discount structures found. Add discounts for manufacturers using the form above.
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={fetchDiscountStructures} 
              sx={{ ml: 2 }}
              color="primary"
            >
              Refresh
            </Button>
          </Alert>
        ) : (
          <TableContainer sx={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledTableCell>ID</StyledTableCell>
                  <StyledTableCell>Manufacturer</StyledTableCell>
                  <StyledTableCell>Discount (%)</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discountStructures.map((structure) => (
                  <StyledTableRow key={structure.discountId}>
                    <StyledTableBodyCell>{structure.discountId}</StyledTableBodyCell>
                    <StyledTableBodyCell>{structure.manufacturer}</StyledTableBodyCell>
                    <StyledTableBodyCell>{(structure as any).discount ?? 0}%</StyledTableBodyCell>
                    <StyledTableBodyCell align="center">
                      <Tooltip title="Edit Discount">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEditClick(structure)}
                          disabled={isEditing(structure.manufacturer)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Discount">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(structure.discountId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </StyledTableBodyCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this discount? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false })} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DiscountManagement; 