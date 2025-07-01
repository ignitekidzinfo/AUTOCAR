import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
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
  Paper,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { SparePartGet } from 'Services/SparePartService';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import InputAdornment from '@mui/material/InputAdornment';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import PreviewIcon from '@mui/icons-material/Preview';
import { Theme } from '@mui/material/styles';
import apiClient from 'Services/apiService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface SparePartItem {
  sparePartId: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  price: number;
  qtyPrice: number;
  updateAt: string | null;
  saleQuantity: number;
  remainingQuantity: number;
  sgst: number | null;
  cgst: number | null;
}

interface SupplierData {
  id: number;
  srNo: number;
  supplierName: string;
}

export default function SpareSaleStockList() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState<SparePartItem[]>([]);
  const [dateValue, setDateValue] = React.useState<[Date | null, Date | null]>([null, null]);
  const [stockBy, setStockBy] = React.useState<string>("ItemWise");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [filteredData, setFilteredData] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<string[]>([]);

  const handleStockByChange = (event: SelectChangeEvent<string>) => {
    setStockBy(event.target.value);
    if (dateValue[0] && dateValue[1]) {
      fetchData(event.target.value);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return dayjs(date).format('YYYY-MM-DDT00:00:00');
  };

  const fetchData = async (viewMode: string = stockBy) => {
    setLoading(true);
    try {
      const fromDate = formatDate(dateValue[0]);
      const toDate = formatDate(dateValue[1]);
      const sortBy = viewMode === 'SupplierWise' ? 'vendor' : 'item';
      
      if (!fromDate || !toDate) {
        console.log("Please select both dates");
        setLoading(false);
        return;
      }
      
      const response = await apiClient.get(
        `/sparePartTransactions/transactions/filter?fromDate=${fromDate}&toDate=${dayjs(dateValue[1]).format('YYYY-MM-DDT23:59:59')}&sortBy=${sortBy}`
      );
      
      console.log("API Response:", response.data);
      
      if (response.data) {
        if (viewMode === 'ItemWise' && Array.isArray(response.data)) {
          // Process item data
          const itemWiseData = response.data.map((item: SparePartItem, index: number) => ({
            id: item.sparePartId || index,
            srNo: index + 1,
            partName: item.partName,
            totalSale: item.saleQuantity || 0,
            avgStock: item.remainingQuantity || 0,
            manufacturer: item.manufacturer,
          }));
          setRows(response.data);
          setFilteredData(itemWiseData);
        } else if (viewMode === 'SupplierWise' && Array.isArray(response.data)) {
          // Process supplier data - assuming response.data is an array of supplier names
          const suppliersData = response.data
            .filter((supplier: string) => supplier !== "") // Filter out empty strings
            .map((supplier: string, index: number) => ({
              id: index + 1,
              srNo: index + 1,
              supplierName: supplier,
            }));
          setSuppliers(response.data);
          setFilteredData(suppliersData);
        }
      }
    } catch (error) {
      console.error("Error fetching spare parts data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!dateValue[0] || !dateValue[1]) {
      alert("Please select both From Date and To Date");
      return;
    }
    fetchData();
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (stockBy === 'ItemWise') {
      const filtered = rows.filter((item: SparePartItem) => 
        item.partName?.toLowerCase().includes(query) || 
        item.manufacturer?.toLowerCase().includes(query) ||
        item.partNumber?.toLowerCase().includes(query)
      ).map((item: SparePartItem, index: number) => ({
        id: item.sparePartId || index,
        srNo: index + 1,
        partName: item.partName,
        totalSale: item.saleQuantity || 0,
        avgStock: item.remainingQuantity || 0,
        manufacturer: item.manufacturer,
      }));
      setFilteredData(filtered);
    } else {
      const filtered = suppliers
        .filter((supplier: string) => supplier?.toLowerCase().includes(query) && supplier !== "")
        .map((supplier: string, index: number) => ({
          id: index + 1,
          srNo: index + 1,
          supplierName: supplier,
        }));
      setFilteredData(filtered);
    }
  };

  const handlePlaceOrder = (supplierName: string) => {
    navigate(`/admin/supplier-order?supplier=${encodeURIComponent(supplierName)}`);
  };

  const handleViewSuppliers = (part: any) => {
    console.log("View suppliers for part:", part);
    const originalRow = rows.find(r => r.sparePartId === part.id);
    console.log("Original row data:", originalRow);
    
    if (originalRow) {
      const url = `/admin/part-suppliers?partNumber=${encodeURIComponent(originalRow.partNumber || '')}&manufacturer=${encodeURIComponent(originalRow.manufacturer || '')}&partName=${encodeURIComponent(originalRow.partName || '')}`;
      console.log("Navigating to:", url);
      navigate(url);
    } else {
      console.error("Could not find original row data for part:", part);
      // Navigate with the data we have
      const url = `/admin/part-suppliers?partNumber=${encodeURIComponent(part.partNumber || '')}&manufacturer=${encodeURIComponent(part.manufacturer || '')}&partName=${encodeURIComponent(part.partName || '')}`;
      console.log("Navigating to (fallback):", url);
      navigate(url);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
          Spare Sale Stock
        </Typography>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3} lg={3}>
          <FormControl fullWidth size="small">
            <ReactDatePicker
              selected={dateValue[0]}
              onChange={(date: Date | null) => setDateValue([date, dateValue[1]])}
              dateFormat="dd-MM-yyyy"
              placeholderText="From Date"
              customInput={
                <OutlinedInput 
                  placeholder="From Date"
                  fullWidth
                  size="small"
                />
              }
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3} lg={3}>
          <FormControl fullWidth size="small">
            <ReactDatePicker
              selected={dateValue[1]}
              onChange={(date: Date | null) => setDateValue([dateValue[0], date])}
              dateFormat="dd-MM-yyyy"
              placeholderText="To Date"
              customInput={
                <OutlinedInput 
                  placeholder="To Date" 
                  fullWidth
                  size="small"
                />
              }
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Stock By</InputLabel>
            <Select
              value={stockBy}
              onChange={handleStockByChange}
              label="Stock By"
              size="small"
            >
              <MenuItem value="ItemWise">ItemWise</MenuItem>
              <MenuItem value="SupplierWise">SupplierWise</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3} lg={4}>
          <FormControl fullWidth size="small">
            <OutlinedInput
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchInput}
              startAdornment={
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              }
            />
          </FormControl>
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSearch}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Search'}
      </Button>

      {stockBy === 'ItemWise' ? (
        // ItemWise view (first image)
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="spare stock table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Sr.No</TableCell>
                <TableCell>Spare Name</TableCell>
                <TableCell align="right">Tot Sale Stock</TableCell>
                <TableCell align="right">Avl. Stock</TableCell>
                <TableCell align="center">Spare Supplier</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row: any) => (
                  <TableRow
                    key={row.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fff9f9' },
                      '&:nth-of-type(even)': { backgroundColor: '#ffffff' },
                    }}
                  >
                    <TableCell>{row.srNo}</TableCell>
                    <TableCell>{row.partName}</TableCell>
                    <TableCell align="right">{row.totalSale}</TableCell>
                    <TableCell align="right">{row.avgStock}</TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#4caf50', 
                          '&:hover': { backgroundColor: '#45a049' } 
                        }}
                        onClick={() => handleViewSuppliers({
                          id: row.id,
                          partNumber: rows.find(r => r.sparePartId === row.id)?.partNumber || '',
                          manufacturer: row.manufacturer || '',
                          partName: row.partName || ''
                        })}
                      >
                        View Suppliers
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // SupplierWise view (second image)
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="supplier table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Sr.No</TableCell>
                <TableCell>Supplier Name</TableCell>
                <TableCell align="center">Spare Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((supplier: any) => (
                  <TableRow
                    key={supplier.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fff9f9' },
                      '&:nth-of-type(even)': { backgroundColor: '#ffffff' },
                    }}
                  >
                    <TableCell>{supplier.srNo}</TableCell>
                    <TableCell>{supplier.supplierName}</TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          backgroundColor: '#4caf50', 
                          '&:hover': { backgroundColor: '#45a049' } 
                        }}
                        onClick={() => handlePlaceOrder(supplier.supplierName)}
                      >
                        Place Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Copyright sx={{ mt: 4 }} />
    </Paper>
  );
} 