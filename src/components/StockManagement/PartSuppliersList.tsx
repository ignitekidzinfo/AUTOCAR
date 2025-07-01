import * as React from 'react';
import {
  Box,
  Button,
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from 'Services/apiService';

interface PartSupplier {
  id: number;
  supplierName: string;
  contact?: string;
  email?: string;
  address?: string;
  orderQty?: number;
  showOrderInput?: boolean;
}

export default function PartSuppliersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partNumber = searchParams.get('partNumber') || '';
  const manufacturer = searchParams.get('manufacturer') || '';
  const partName = searchParams.get('partName') || '';
  
  const [suppliers, setSuppliers] = React.useState<PartSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = React.useState<PartSupplier[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [activeSupplier, setActiveSupplier] = React.useState<PartSupplier | null>(null);
  
  React.useEffect(() => {
    const fetchPartSuppliers = async () => {
      setLoading(true);
      try {
        console.log(`Fetching suppliers for part: ${partNumber}, manufacturer: ${manufacturer}`);
        const response = await apiClient.get(`/vendorParts/vendors?partNumber=${encodeURIComponent(partNumber)}&manufacturer=${encodeURIComponent(manufacturer)}`);
        console.log("API Response:", response.data);
        
        // Handle the actual response format with vendors array
        if (response.data && response.data.vendors && Array.isArray(response.data.vendors)) {
          const suppliersWithSelection = response.data.vendors.map((vendor: any, index: number) => ({
            id: vendor.vendorId || index + 1,
            supplierName: vendor.name || '',
            contact: vendor.mobileNumber?.toString() || '',
            email: '',
            address: vendor.address || '',
            orderQty: 0,
            showOrderInput: false
          }));
          setSuppliers(suppliersWithSelection);
          setFilteredSuppliers(suppliersWithSelection);
        } else {
          console.log("No vendors found or invalid response format");
          setSuppliers([]);
          setFilteredSuppliers([]);
        }
      } catch (error) {
        console.error("Error fetching suppliers for part:", error);
        // Mock data for development
        const mockSuppliers = [
          { id: 1, supplierName: 'Car Care Purchase Missing', address: 'Phaltan', contact: '', email: '', orderQty: 0, showOrderInput: false },
        ];
        setSuppliers(mockSuppliers);
        setFilteredSuppliers(mockSuppliers);
      } finally {
        setLoading(false);
      }
    };

    if (partNumber && manufacturer) {
      fetchPartSuppliers();
    }
  }, [partNumber, manufacturer]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (activeSupplier) {
      // If there's an active supplier, don't filter
      return;
    }
    
    if (query) {
      const filtered = suppliers.filter(supplier => 
        supplier.supplierName.toLowerCase().includes(query) ||
        supplier.address?.toLowerCase().includes(query) ||
        supplier.contact?.toLowerCase().includes(query)
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  };

  const handleQuantityChange = (value: string) => {
    if (activeSupplier) {
      const qty = parseInt(value) || 0;
      setActiveSupplier({
        ...activeSupplier,
        orderQty: qty
      });
    }
  };

  const toggleOrderInput = (supplier: PartSupplier) => {
    // Set the active supplier and show order input
    setActiveSupplier({
      ...supplier,
      showOrderInput: true,
      orderQty: 1 // Default to 1
    });
  };

  const cancelOrder = () => {
    setActiveSupplier(null);
    // Restore filtered suppliers
    if (searchQuery) {
      const filtered = suppliers.filter(supplier => 
        supplier.supplierName.toLowerCase().includes(searchQuery) ||
        supplier.address?.toLowerCase().includes(searchQuery) ||
        supplier.contact?.toLowerCase().includes(searchQuery)
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  };

  const handlePrint = () => {
    if (!activeSupplier || !activeSupplier.orderQty || activeSupplier.orderQty <= 0) {
      alert('Please set a valid order quantity');
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
          <title>Supplier Order</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
            .supplier-info { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>Supplier Order</h3>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Spare Name</th>
                <th>Order Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${manufacturer} - ${partNumber} - ${partName}</td>
                <td align="center">${activeSupplier.orderQty}</td>
              </tr>
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

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
            Spare Supplier List
          </Typography>
        </Box>
        {!activeSupplier && (
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
        )}
      </Stack>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Spare Name: <strong>{partName || `${manufacturer} ${partNumber}`}</strong>
      </Typography>

      {activeSupplier ? (
        <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Placing Order with: <strong>{activeSupplier.supplierName}</strong>
            </Typography>
            <IconButton onClick={cancelOrder} color="error">
              <CloseIcon />
            </IconButton>
          </Stack>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Contact: {activeSupplier.contact || 'N/A'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Address: {activeSupplier.address || 'N/A'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Order Quantity:
            </Typography>
            <TextField
              type="number"
              variant="outlined"
              size="small"
              value={activeSupplier.orderQty || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{ width: 100 }}
            />
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!activeSupplier.orderQty || activeSupplier.orderQty <= 0}
          >
            Print Order
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="part suppliers table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Sr.No</TableCell>
                <TableCell>Supplier Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Place Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier, index) => (
                  <TableRow
                    key={supplier.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fff9f9' },
                      '&:nth-of-type(even)': { backgroundColor: '#ffffff' },
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{supplier.supplierName}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#4caf50', 
                          '&:hover': { backgroundColor: '#45a049' } 
                        }}
                        onClick={() => toggleOrderInput(supplier)}
                      >
                        Place Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="h5" color="error" sx={{ py: 5, fontWeight: 'medium' }}>
                      Supplier Not Found For This Part
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
} 