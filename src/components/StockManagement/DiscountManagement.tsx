import React, { useState, useEffect } from 'react';
import apiClient from '../../Services/apiService';
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
  Radio,
  RadioGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// Types
interface DiscountStructureDTO {
  discountId?: number;
  manufacturer: string;
  discount: number;
}

interface ManufacturerDiscount {
  manufacturer: string;
  selectedDiscount: number;
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
  // State
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [discountStructures, setDiscountStructures] = useState<DiscountStructureDTO[]>([]);
  const [manufacturerDiscounts, setManufacturerDiscounts] = useState<ManufacturerDiscount[]>([]);
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

  // Fetch manufacturers and discount structures on component mount
  useEffect(() => {
    fetchManufacturers();
    fetchDiscountStructures();
  }, []);

  // Initialize manufacturer discounts when manufacturers are loaded
  useEffect(() => {
    const initialManufacturerDiscounts = manufacturers.map(manufacturer => ({
      manufacturer,
      selectedDiscount: 0
    }));
    setManufacturerDiscounts(initialManufacturerDiscounts);
  }, [manufacturers]);

  // Update manufacturer discounts when discount structures are loaded
  useEffect(() => {
    if (discountStructures.length > 0 && manufacturerDiscounts.length > 0) {
      const updatedManufacturerDiscounts = [...manufacturerDiscounts];
      
      discountStructures.forEach(structure => {
        const index = updatedManufacturerDiscounts.findIndex(
          item => item.manufacturer === structure.manufacturer
        );
        
        if (index !== -1) {
          updatedManufacturerDiscounts[index].selectedDiscount = structure.discount;
        }
      });
      
      setManufacturerDiscounts(updatedManufacturerDiscounts);
    }
  }, [discountStructures, manufacturers]);

  // Fetch all manufacturers
  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('http://localhost:8080/Filter/manufacturers');
      if (response.status === 200) {
        setManufacturers(response.data);
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      showSnackbar('Failed to fetch manufacturers', 'error');
      // Use sample data if API fails
      setManufacturers(['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi']);
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
      showSnackbar('Failed to fetch discount structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle discount selection
  const handleDiscountChange = (manufacturer: string, discount: number) => {
    const updatedDiscounts = manufacturerDiscounts.map(item => {
      if (item.manufacturer === manufacturer) {
        return {
          ...item,
          selectedDiscount: item.selectedDiscount === discount ? 0 : discount
        };
      }
      return item;
    });
    
    setManufacturerDiscounts(updatedDiscounts);
  };

  // Add discount for a manufacturer
  const handleAddDiscount = async (manufacturer: string) => {
    const discountData = manufacturerDiscounts.find(item => item.manufacturer === manufacturer);
    
    if (!discountData || discountData.selectedDiscount === 0) {
      showSnackbar('Please select a discount percentage', 'warning');
      return;
    }
    
    setSavingManufacturer(manufacturer);
    
    // Create discount structure with the selected discount
    const discountStructure: DiscountStructureDTO = {
      manufacturer: manufacturer,
      discount: discountData.selectedDiscount
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
          selectedDiscount: discount.discount
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
    
    if (!discountData || !existingDiscount || discountData.selectedDiscount === 0) {
      showSnackbar('Please select a discount percentage', 'warning');
      return;
    }

    if (discountData.selectedDiscount === existingDiscount.discount) {
      showSnackbar('No changes to update', 'info');
      setCurrentEditDiscount(null);
      return;
    }
    
    setSavingManufacturer(manufacturer);
    
    // Update discount structure with the selected discount
    const updatedDiscount: DiscountStructureDTO = {
      discountId: existingDiscount.discountId,
      manufacturer: manufacturer,
      discount: discountData.selectedDiscount
    };
    
    try {
      const response = await apiClient.patch(`/discounts/${existingDiscount.discountId}`, updatedDiscount);
      if (response.status === 200) {
        showSnackbar(`Discount updated for ${manufacturer}`, 'success');
        fetchDiscountStructures(); // Refresh the list
        setCurrentEditDiscount(null);
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
          <Alert severity="info" sx={{ borderRadius: 1 }}>No manufacturers found.</Alert>
        ) : (
          <TableContainer sx={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
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
                    item => item.manufacturer === manufacturer
                  );
                  const selectedDiscount = discountData?.selectedDiscount || 0;
                  const existingDiscount = getExistingDiscount(manufacturer);
                  const isCurrentlyEditing = isEditing(manufacturer);
                  
                  return (
                    <StyledTableRow key={manufacturer}>
                      <StyledTableBodyCell>{manufacturer}</StyledTableBodyCell>
                      <StyledTableBodyCell align="center">
                        <RadioGroup 
                          row 
                          value={selectedDiscount}
                          onChange={(e) => handleDiscountChange(manufacturer, Number(e.target.value))}
                          sx={{ justifyContent: 'center' }}
                        >
                          <FormControlLabel
                            value={5}
                            control={<Radio />}
                            label="5%"
                          />
                          <FormControlLabel
                            value={10}
                            control={<Radio />}
                            label="10%"
                          />
                          <FormControlLabel
                            value={15}
                            control={<Radio />}
                            label="15%"
                          />
                        </RadioGroup>
                      </StyledTableBodyCell>
                      <StyledTableBodyCell align="center">
                        {isCurrentlyEditing ? (
                          <StyledButton
                            variant="contained"
                            color="primary"
                            onClick={() => handleUpdateDiscount(manufacturer)}
                            disabled={savingManufacturer === manufacturer}
                          >
                            {savingManufacturer === manufacturer ? (
                              <CircularProgress size={24} />
                            ) : 'Save'}
                          </StyledButton>
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
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Discount Structures
        </Typography>
        
        {loading && discountStructures.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : discountStructures.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>No discount structures found. Add one above.</Alert>
        ) : (
          <TableContainer sx={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
            <Table>
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
                    <StyledTableBodyCell>{structure.discount}%</StyledTableBodyCell>
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