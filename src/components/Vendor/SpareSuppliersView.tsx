import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  useTheme,
  styled,
  alpha,
  Tooltip,
  Stack,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Checkbox,
  DialogActions,
  InputAdornment,
  InputLabel
} from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PrintIcon from '@mui/icons-material/Print';
import apiClient from "Services/apiService";

// --- Data interfaces ---
interface Supplier {
  vendorId: number;
  name: string;
  address: string;
  mobileNumber: number;
  email?: string;       
  spareBrand?: string;  
}

interface VendorApiResponse {
  vendors: Supplier[];
  message: string;
  description?: string;
}

interface OrderItem {
  id: number;
  spareName: string;
  partNumber: string;
  saleQty: number;
  availableQty: number;
  selected: boolean;
  orderQty: number;
}

// --- Styled components ---
const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(3),
  width: "100%",
  overflowX: "auto",
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[4],
  background: "#ffffff"
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.getContrastText("#616161"),
  backgroundColor: "#616161",
  borderBottom: "none"
}));

const PlaceOrderButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
  borderRadius: 4,
  textTransform: "none",
}));

const PrintOrderButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  borderRadius: 4,
  textTransform: "none",
  padding: "8px 24px",
  margin: "20px auto",
  display: "flex",
}));

// --- Component ---
const SpareSuppliersView: React.FC = () => {
  const { partNumber = "", manufacturer = "" } = useParams<{
    partNumber: string;
    manufacturer: string;
  }>();
  const location = useLocation();
  const initialDescription = location.state?.description || "";
  const initialQuantity = location.state?.quantity || 0;
  const initialPrice = location.state?.price || 0;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>(initialDescription);
  
  // Order dialog state
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: 1,
      spareName: manufacturer + " " + partNumber + (description ? " " + description : ""),
      partNumber: partNumber,
      saleQty: initialPrice,
      availableQty: initialQuantity,
      selected: true,
      orderQty: 1
    }
  ]);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!partNumber || !manufacturer) {
        setError("Missing partNumber or manufacturer in URL");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<VendorApiResponse>(
          "/vendorParts/vendors",
          {
            params: {
              partNumber,    // exactly as the API wants it
              manufacturer,  // exactly as the API wants it
            },
          }
        );

        setSuppliers(response.data.vendors);
        if (response.data.description && !initialDescription) {
          setDescription(response.data.description);
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError("Failed to load suppliers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [partNumber, manufacturer, initialDescription]);

  useEffect(() => {
    // Update order items when part data changes
    setOrderItems([
      {
        id: 1,
        spareName: manufacturer + " " + partNumber + (description ? " " + description : ""),
        partNumber: partNumber,
        saleQty: initialPrice,
        availableQty: initialQuantity,
        selected: true,
        orderQty: 1
      }
    ]);
  }, [manufacturer, partNumber, description, initialPrice, initialQuantity]);

  const handleOpenOrderDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
  };

  const handleOrderQtyChange = (id: number, qty: number) => {
    setOrderItems(
      orderItems.map(item => 
        item.id === id ? { ...item, orderQty: qty } : item
      )
    );
  };

  const handleItemSelection = (id: number, checked: boolean) => {
    setOrderItems(
      orderItems.map(item => 
        item.id === id ? { ...item, selected: checked } : item
      )
    );
  };

  const handlePrintOrder = () => {
    // Get only the selected order items
    const selectedItems = orderItems.filter(item => item.selected);
    
    // Create a printable window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website');
      return;
    }
    
    // Generate HTML content for the print window - simplified format
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Spare Order</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            background: white;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .order-row {
            background-color: #fce4ec;
          }
          .center {
            text-align: center;
          }
          .title {
            margin-top: 0;
            font-size: 16px;
            font-weight: bold;
          }
          @media print {
            @page {
              size: auto;
              margin: 10mm;
            }
          }
        </style>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }
        </script>
      </head>
      <body>
        <div class="container">
          <p class="title">Supplier: ${selectedSupplier?.name || ''}</p>
          <p class="title">Spare Order</p>
          
          <table>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Spare Name</th>
                <th>#</th>
                <th>Order Qty</th>
              </tr>
            </thead>
            <tbody>
              ${selectedItems.map((item, index) => `
                <tr class="order-row">
                  <td>${index + 1}</td>
                  <td>${item.spareName}</td>
                  <td class="center">✓</td>
                  <td class="center">${item.orderQty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    // Write to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        padding: { xs: 1, sm: 2, md: 3 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link
          to="/admin/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: theme.palette.primary.main,
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link
          to="/admin/transaction-list"
          style={{
            textDecoration: "none",
            color: theme.palette.primary.main,
          }}
        >
          Spare List
        </Link>
        <Typography color="text.primary">
          Spare Supplier List
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Spare Supplier List
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Spare Name: {manufacturer} (Part #: {partNumber})
        </Typography>
        {description && (
          <Typography 
            variant="body1" 
            color="text.secondary" 
            gutterBottom
            sx={{ 
              mt: 1,
              p: 1, 
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 1
            }}
          >
            <strong>Description:</strong> {description}
          </Typography>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <StyledPaper>
        <Table sx={{ minWidth: isMobile ? 300 : 650 }}>
          <TableHead>
            <TableRow>
              <StyledTableCell>Sr.No</StyledTableCell>
              <StyledTableCell>Supplier Name</StyledTableCell>
              <StyledTableCell>Contact</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell>Place Order</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.length > 0 ? (
              suppliers.map((supplier, idx) => (
                <TableRow key={supplier.vendorId}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.mobileNumber}</TableCell>
                  <TableCell>{supplier.address}</TableCell>
                  <TableCell>{supplier.email ?? "—"}</TableCell>
                  <TableCell>
                    <PlaceOrderButton
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenOrderDialog(supplier)}
                    >
                      Place Order
                    </PlaceOrderButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No suppliers found for this spare part.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledPaper>

      {/* Back button */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ borderRadius: 1 }}
        >
          Back to List
        </Button>
      </Box>

      {/* Order Dialog */}
      <Dialog 
        open={isOrderDialogOpen} 
        onClose={handleCloseOrderDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          fontWeight: 'bold'
        }}>
          Supplier Spare List
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 2 }}>
          {selectedSupplier && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Supplier: {selectedSupplier.name}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Spare Order
              </Typography>
              
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sr.No</TableCell>
                    <TableCell>Spare Name</TableCell>
                    <TableCell align="center">Avl. Qty</TableCell>
                    <TableCell align="center">#</TableCell>
                    <TableCell align="center">Order Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow 
                      key={item.id}
                      sx={{ 
                        backgroundColor: item.selected ? alpha(theme.palette.error.light, 0.1) : 'inherit'
                      }}
                    >
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.spareName}</TableCell>
                      <TableCell align="center">{item.availableQty}</TableCell>
                      <TableCell align="center">
                        <Checkbox 
                          checked={item.selected}
                          onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={item.orderQty}
                          onChange={(e) => handleOrderQtyChange(item.id, parseInt(e.target.value, 10) || 0)}
                          disabled={!item.selected}
                          inputProps={{ min: 1 }}
                          size="small"
                          sx={{ width: '100px' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <PrintOrderButton 
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrintOrder}
                >
                  Print Order
                </PrintOrderButton>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SpareSuppliersView;
 