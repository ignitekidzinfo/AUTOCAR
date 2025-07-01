import * as React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  OutlinedInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from 'Services/apiService';

interface SparePartItem {
  sparePartId: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  price: number;
  saleQuantity: number;
  remainingQuantity: number;
  selected?: boolean;
  orderQty?: number;
}

export default function SupplierOrderPage() {
  const navigate = useNavigate();
  const { vendorName } = useParams<{ vendorName: string }>();
  const location = useLocation();
  const supplierName = vendorName || new URLSearchParams(location.search).get('supplier') || '';
  
  const [parts, setParts] = React.useState<SparePartItem[]>([]);
  const [filteredParts, setFilteredParts] = React.useState<SparePartItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  
  const handlePrint = () => {
    const selectedParts = getSelectedParts();
    if (selectedParts.length === 0) {
      alert('Please select at least one part to print');
      return;
    }
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website');
      return;
    }
    
    // Create the print content
    const printContent = `
      <html>
        <head>
          <title>Purchase Order - ${supplierName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
            .supplier-info { margin-bottom: 20px; }
            .total-row { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>Purchase Order</h3>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="supplier-info">
            <h4>Supplier: ${supplierName}</h4>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Spare Name</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${selectedParts.map((part, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${part.manufacturer} - ${part.partNumber} - ${part.partName}</td>
                  <td align="center">${part.orderQty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Automatically print once the content is loaded
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
    };
  };

  React.useEffect(() => {
    const fetchSupplierParts = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/sparePartTransactions/parts/by-vendor/with-quantities?vendorName=${encodeURIComponent(supplierName)}`);
        if (response.data && Array.isArray(response.data)) {
          const partsWithSelection = response.data.map((part: SparePartItem) => ({
            ...part,
            selected: false,
            orderQty: 0
          }));
          setParts(partsWithSelection);
          setFilteredParts(partsWithSelection);
        }
      } catch (error) {
        console.error("Error fetching parts for supplier:", error);
      } finally {
        setLoading(false);
      }
    };

    if (supplierName) {
      fetchSupplierParts();
    }
  }, [supplierName]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query) {
      const filtered = parts.filter(part => 
        part.partName.toLowerCase().includes(query) ||
        part.partNumber.toLowerCase().includes(query) ||
        part.manufacturer.toLowerCase().includes(query)
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts(parts);
    }
  };

  const handleCheckboxChange = (id: number) => {
    const updatedParts = parts.map(part => 
      part.sparePartId === id ? { ...part, selected: !part.selected } : part
    );
    setParts(updatedParts);
    
    // Update filtered parts as well
    const updatedFiltered = filteredParts.map(part => 
      part.sparePartId === id ? { ...part, selected: !part.selected } : part
    );
    setFilteredParts(updatedFiltered);
  };

  const handleQuantityChange = (id: number, value: string) => {
    const qty = parseInt(value) || 0;
    
    const updatedParts = parts.map(part => 
      part.sparePartId === id ? { ...part, orderQty: qty } : part
    );
    setParts(updatedParts);
    
    // Update filtered parts as well
    const updatedFiltered = filteredParts.map(part => 
      part.sparePartId === id ? { ...part, orderQty: qty } : part
    );
    setFilteredParts(updatedFiltered);
  };

  const getSelectedParts = () => {
    return parts.filter(part => part.selected && part.orderQty && part.orderQty > 0);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
            Supplier Spare List
          </Typography>
        </Box>
        <OutlinedInput
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
          size="small"
          sx={{ width: 300 }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          }
        />
      </Stack>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Supplier: <strong>{supplierName}</strong>
      </Typography>

      <Typography variant="h6" sx={{ mb: 1, mt: 3 }}>
        Spare Order
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="supplier parts table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>Sr.No</TableCell>
              <TableCell>Spare Name</TableCell>
              <TableCell>Part Number</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell align="right">Sale Qty</TableCell>
              <TableCell align="right">Avl. Qty</TableCell>
              <TableCell align="center">Order Qty</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredParts.length > 0 ? (
              filteredParts.map((part, index) => (
                <TableRow
                  key={part.sparePartId}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#fff9f9' },
                    '&:nth-of-type(even)': { backgroundColor: '#ffffff' },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={part.selected || false}
                      onChange={() => handleCheckboxChange(part.sparePartId)}
                      sx={{ 
                        color: '#2196f3',
                        '&.Mui-checked': {
                          color: '#2196f3',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 24,
                        },
                        padding: '4px',
                        backgroundColor: part.selected ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                        borderRadius: '4px',
                      }}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{part.partName}</TableCell>
                  <TableCell>{part.partNumber}</TableCell>
                  <TableCell>{part.manufacturer}</TableCell>
                  <TableCell align="right">{part.saleQuantity}</TableCell>
                  <TableCell align="right">{part.remainingQuantity}</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      value={part.orderQty || ''}
                      onChange={(e) => handleQuantityChange(part.sparePartId, e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">No parts found for this supplier</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={getSelectedParts().length === 0}
        >
          Print Order
        </Button>
      </Box>
    </Paper>
  );
} 