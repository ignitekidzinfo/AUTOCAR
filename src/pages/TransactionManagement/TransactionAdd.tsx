import * as React from 'react';
import { useState, useEffect, FormEvent, useMemo } from "react";
import apiClient from "Services/apiService";
import storageUtils from '../../utils/storageUtils';

import {
  Box,
  Grid,
  Typography,
  Button,
  OutlinedInput,
  FormLabel,
  styled,
  Stack,
  Snackbar,
  Alert,
  Autocomplete,
  TextField,
  createFilterOptions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';

const FormGrid = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
}));

interface GSTData {
  gst0: number;
  gst5: number;
  gst12: number;
  gst18: number;
  gst28: number;
}

interface CreateTransaction {
  transactionType: "CREDIT" | "DEBIT";
  userId?: number;
  vehicleRegId?: number;
  vendorId?: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: string;
  price: number;
  billNo?: string;
  name: string;
  gstPercentage: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  description?: string;
}

interface Feedback {
  message: string;
  severity: "success" | "error";
}

interface Vendor {
  vendorId: number;
  name: string;
}

interface SparePartDto {
  partName: string;
  partNumber: string;
  manufacturer: string;
  description?: string;  
}

interface RecentTransaction {
  id?: number;
  createdAt?: string;
  transactionType: "CREDIT" | "DEBIT";
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: string;
  price: number;
  billNo?: string;
  name: string;
  gstPercentage: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

interface GSTBreakdown {
  gst0: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
  gst5: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
  gst9: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
  gst12: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
  gst18: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
  gst28: {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    items: RecentTransaction[];
  };
}

const initialCreateData: CreateTransaction = {
  transactionType: "CREDIT",
  userId: 10006,
  vehicleRegId: undefined,
  partNumber: "",
  partName: "",
  manufacturer: "",
  quantity: "1",
  price: 0,
  billNo: "",
  name: "",
  gstPercentage: 0,
  taxableAmount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalAmount: 0
};

const initialGSTBreakdown: GSTBreakdown = {
  gst0: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] },
  gst5: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] },
  gst9: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] },
  gst12: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] },
  gst18: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] },
  gst28: { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, items: [] }
};

const filterOptions = createFilterOptions<SparePartDto>({
  matchFrom: 'any',
  stringify: (option) =>
    `${option.manufacturer} ${option.partName} ${option.partNumber} ${option.description || ""}`,
});

const TransactionAdd: React.FC = () => {
  const [createData, setCreateData] = useState<CreateTransaction>(initialCreateData);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [gstTotals, setGstTotals] = useState<GSTData>({
    gst0: 0,
    gst5: 0,
    gst12: 0,
    gst18: 0,
    gst28: 0
  });

  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [partSuggestions, setPartSuggestions] = useState<SparePartDto[]>([]);
  const [selectedPart, setSelectedPart] = useState<SparePartDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [gstBreakdown, setGstBreakdown] = useState<GSTBreakdown>(initialGSTBreakdown);

  const navigate = useNavigate();

  let userRole: string = "";
  const userData = storageUtils.getUserData();
  if (userData) {
    userRole = userData.authorities?.[0] || "";
  }

  const memoizedVendorSuggestions = useMemo(() => vendorSuggestions, [vendorSuggestions]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get("/vendor/getAll");
      console.log("Vendors:", response.data);
      const vendors: Vendor[] = Array.isArray(response.data)
        ? response.data
        : response.data.vendors || [];
      setVendorSuggestions(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchPartsBySearch = async (query: string) => {
    try {
      const response = await apiClient.get(`/Filter/searchBarFilter?searchBarInput=${query}`);
      let parts: SparePartDto[] = [];
      if (Array.isArray(response.data)) {
        parts = response.data;
      } else if (Array.isArray(response.data.list)) {
        parts = response.data.list;
      } else if (Array.isArray(response.data.content)) {
        parts = response.data.content;
      }
      setPartSuggestions(parts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setPartSuggestions([]);
    }
  };

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Add effect to trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      fetchPartsBySearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const handlePartInputChange = (event: any, value: string, reason: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setPartSuggestions([]);
    }
  };

  const handleSelectPart = (event: any, newValue: SparePartDto | null) => {
    setSelectedPart(newValue);
    if (newValue) {
      setCreateData((prev) => ({
        ...prev,
        manufacturer: newValue.manufacturer,
        partNumber: newValue.partNumber,
        partName: newValue.partName,
        description: newValue.description || "",
      }));
    } else {
      setCreateData(prev => ({
        ...initialCreateData,
        name: prev.name,
        billNo: prev.billNo
      }));
    }
  };

  const handleSelectVendor = (event: any, newValue: Vendor | null) => {
    console.log("Vendor selected:", newValue);
    setSelectedVendor(newValue);
    setCreateData((prev) => ({
      ...prev,
      name: newValue ? newValue.name : "",
      vendorId: newValue ? newValue.vendorId : undefined,
    }));
    console.log("Updated vendor data:", {
      name: newValue ? newValue.name : "",
      vendorId: newValue ? newValue.vendorId : undefined
    });
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFormPartially = () => {
    // Keep vendor and bill number, reset other fields
    setCreateData(prev => ({
      ...initialCreateData,
      name: prev.name,
      billNo: prev.billNo,
      vendorId: prev.vendorId,
      userId: prev.userId
    }));
    setSelectedPart(null);
    setSearchTerm("");
    setPartSuggestions([]);
  };

  const calculateGSTValues = (price: number, quantity: number, gstPercentage: number) => {
    const taxableAmount = price * quantity;
    const gstAmount = (taxableAmount * gstPercentage) / 100;
    
    // Explicitly calculate CGST and SGST as half of total GST
    const cgst = gstPercentage > 0 ? gstAmount / 2 : 0;
    const sgst = gstPercentage > 0 ? gstAmount / 2 : 0;
    
    console.log("GST Calculation:", {
      price,
      quantity, 
      taxableAmount,
      gstPercentage,
      gstAmount,
      cgst,
      sgst,
      totalAmount: taxableAmount + gstAmount
    });
    
    return {
      taxableAmount,
      cgst,
      sgst,
      igst: 0,
      totalAmount: taxableAmount + gstAmount
    };
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    const quantity = parseInt(createData.quantity) || 0;
    const gstPercentage = createData.gstPercentage;
    
    const gstValues = calculateGSTValues(price, quantity, gstPercentage);
    
    setCreateData(prev => ({
      ...prev,
      price,
      ...gstValues
    }));
  };

  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gstPercentage = parseFloat(e.target.value) || 0;
    const price = createData.price;
    const quantity = parseInt(createData.quantity) || 0;
    
    const gstValues = calculateGSTValues(price, quantity, gstPercentage);
    
    setCreateData(prev => ({
      ...prev,
      gstPercentage,
      ...gstValues
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = e.target.value;
    const price = createData.price;
    const gstPercentage = createData.gstPercentage;
    
    const gstValues = calculateGSTValues(price, parseInt(quantity) || 0, gstPercentage);
    
    setCreateData(prev => ({
      ...prev,
      quantity,
      ...gstValues
    }));
  };

  const updateGSTBreakdown = (transaction: RecentTransaction) => {
    setGstBreakdown(prev => {
      const key = `gst${transaction.gstPercentage}` as keyof GSTBreakdown;
      const section = prev[key];
      
      return {
        ...prev,
        [key]: {
          taxableAmount: section.taxableAmount + transaction.taxableAmount,
          cgst: section.cgst + transaction.cgst,
          sgst: section.sgst + transaction.sgst,
          igst: section.igst + transaction.igst,
          items: [...section.items, transaction]
        }
      };
    });
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      console.log("Submit data check - vendor:", { 
        vendorId: createData.vendorId, 
        name: createData.name,
        selectedVendor 
      });
      
      if (!createData.vendorId || !selectedVendor) {
        setFeedback({
          message: "Please select a vendor from the dropdown list",
          severity: "error"
        });
        return;
      }
      
      if (!createData.partNumber) {
        setFeedback({
          message: "Please select a spare part",
          severity: "error"
        });
        return;
      }
      
      const dataToSubmit = {
        ...createData,
        quantity: parseInt(createData.quantity),
        partName: createData.partName,
        partNumber: createData.partNumber,
        description: createData.description,
        vendorId: createData.vendorId,
        totalsgst: createData.gstPercentage || 0
      };
      
      console.log("Submitting transaction with vendor ID:", dataToSubmit.vendorId);
      console.log("GST details:", {
        gstPercentage: dataToSubmit.gstPercentage,
        cgst: dataToSubmit.cgst,
        sgst: dataToSubmit.sgst,
        totalsgst: dataToSubmit.totalsgst
      });
      const response = await apiClient.post("/sparePartTransactions/add", dataToSubmit);
      
      const recentTransaction: RecentTransaction = {
        ...createData,
        id: response.data.id,
        createdAt: new Date().toISOString()
      };

      setRecentTransactions(prev => [...prev, recentTransaction]);
      updateGSTBreakdown(recentTransaction);
      setFeedback({
        message: "Transaction created successfully",
        severity: "success"
      });
      resetFormPartially();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      setFeedback({
        message: error.response?.data?.message || "Failed to create transaction",
        severity: "error"
      });
    }
  };

  const calculateTotals = () => {
    return {
      totalTaxableAmount: Object.values(gstBreakdown).reduce((sum, section) => sum + section.taxableAmount, 0),
      totalCGST: Object.values(gstBreakdown).reduce((sum, section) => sum + section.cgst, 0),
      totalSGST: Object.values(gstBreakdown).reduce((sum, section) => sum + section.sgst, 0),
      totalIGST: Object.values(gstBreakdown).reduce((sum, section) => sum + section.igst, 0),
    };
  };

  const handleCloseSnackbar = () => {
    setFeedback(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        maxWidth: { sm: '100%', md: '90%' },
        maxHeight: '720px',
        gap: { xs: 2, md: 'none' },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="h6">
          Add Transaction
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <form onSubmit={handleCreateSubmit}>
        <Grid container spacing={3}>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="vendorName">Vendor Name</FormLabel>
            <Autocomplete
              disablePortal
              openOnFocus
              noOptionsText="No vendors available"
              options={memoizedVendorSuggestions}
              getOptionLabel={(option) => option.name}
              onChange={handleSelectVendor}
              value={selectedVendor}
              isOptionEqualToValue={(option, value) => option.vendorId === value.vendorId}
              renderInput={(params) => <TextField {...params} label="Vendor Name" />}
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="billNo">
              Bill Number
            </FormLabel>
            <OutlinedInput
              name="billNo"
              value={createData.billNo}
              onChange={handleCreateChange}
              placeholder="Enter Bill Number"
              size="small"
              required
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="partName">Spare Part (Search)</FormLabel>
            <Autocomplete
              disablePortal
              openOnFocus
              noOptionsText="No parts found"
              options={partSuggestions}
              filterOptions={filterOptions}
              getOptionLabel={(option) =>
           
                `${option.manufacturer} - ${option.partName} - ${option.description || "No Description"}`
              }
              onInputChange={handlePartInputChange}
              onChange={handleSelectPart}
              value={selectedPart}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Part Search with Part Number/Name/Manufacturer/Description"
                />
              )}
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="partNumber">
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

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="quantity">
              Quantity
            </FormLabel>
            <OutlinedInput
              name="quantity"
              value={createData.quantity}
              onChange={handleQuantityChange}
              type="number"
              size="small"
              required
              inputProps={{ min: 1 }}
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="description">Description</FormLabel>
            <OutlinedInput
              name="description"
              value={createData.description}
              onChange={handleCreateChange}
              placeholder="Description"
              size="small"
              disabled
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="price">Price</FormLabel>
            <OutlinedInput
              name="price"
              value={createData.price || ''}
              onChange={handlePriceChange}
              type="number"
              size="small"
              required
              inputProps={{ min: 0 }}
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="gstPercentage">GST%</FormLabel>
            <OutlinedInput
              name="gstPercentage"
              value={createData.gstPercentage || ''}
              onChange={handleGSTChange}
              type="number"
              size="small"
              required
              inputProps={{ min: 0 }}
            />
          </FormGrid>

          <FormGrid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Create Transaction
            </Button>
          </FormGrid>
        </Grid>
      </form>

      {/* Recent Transactions Table */}
      {recentTransactions.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Part Name</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Bill No</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.partNumber}</TableCell>
                    <TableCell>{transaction.partName}</TableCell>
                    <TableCell>{transaction.manufacturer}</TableCell>
                    <TableCell align="right">{transaction.quantity}</TableCell>
                    <TableCell>{transaction.name}</TableCell>
                    <TableCell>{transaction.billNo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Updated GST Summary Table */}
      {recentTransactions.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Total Sale</TableCell>
                <TableCell>Total Taxable</TableCell>
                <TableCell>Total CGST</TableCell>
                <TableCell>Total SGST</TableCell>
                <TableCell>Total IGST</TableCell>
                <TableCell>Sale 0%</TableCell>
                <TableCell>Taxable 0%</TableCell>
                <TableCell>Sale 5%</TableCell>
                <TableCell>Taxable 5%</TableCell>
                <TableCell>CGST 2.5%</TableCell>
                <TableCell>SGST 2.5%</TableCell>
                <TableCell>IGST 5%</TableCell>
                <TableCell>Sale 9%</TableCell>
                <TableCell>Taxable 9%</TableCell>
                <TableCell>CGST 4.5%</TableCell>
                <TableCell>SGST 4.5%</TableCell>
                <TableCell>IGST 9%</TableCell>
                <TableCell>Sale 12%</TableCell>
                <TableCell>Taxable 12%</TableCell>
                <TableCell>CGST 6%</TableCell>
                <TableCell>SGST 6%</TableCell>
                <TableCell>IGST 12%</TableCell>
                <TableCell>Sale 18%</TableCell>
                <TableCell>Taxable 18%</TableCell>
                <TableCell>CGST 9%</TableCell>
                <TableCell>SGST 9%</TableCell>
                <TableCell>IGST 18%</TableCell>
                <TableCell>Sale 28%</TableCell>
                <TableCell>Taxable 28%</TableCell>
                <TableCell>CGST 14%</TableCell>
                <TableCell>SGST 14%</TableCell>
                <TableCell>IGST 28%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{calculateTotals().totalTaxableAmount.toFixed(2)}</TableCell>
                <TableCell>{calculateTotals().totalTaxableAmount.toFixed(2)}</TableCell>
                <TableCell>{calculateTotals().totalCGST.toFixed(2)}</TableCell>
                <TableCell>{calculateTotals().totalSGST.toFixed(2)}</TableCell>
                <TableCell>{calculateTotals().totalIGST.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst0.taxableAmount).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst0.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst5.taxableAmount + gstBreakdown.gst5.cgst + gstBreakdown.gst5.sgst).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst5.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst5.cgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst5.sgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst5.igst.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst9.taxableAmount + gstBreakdown.gst9.cgst + gstBreakdown.gst9.sgst).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst9.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst9.cgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst9.sgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst9.igst.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst12.taxableAmount + gstBreakdown.gst12.cgst + gstBreakdown.gst12.sgst).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst12.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst12.cgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst12.sgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst12.igst.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst18.taxableAmount + gstBreakdown.gst18.cgst + gstBreakdown.gst18.sgst).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst18.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst18.cgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst18.sgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst18.igst.toFixed(2)}</TableCell>
                <TableCell>{(gstBreakdown.gst28.taxableAmount + gstBreakdown.gst28.cgst + gstBreakdown.gst28.sgst).toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst28.taxableAmount.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst28.cgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst28.sgst.toFixed(2)}</TableCell>
                <TableCell>{gstBreakdown.gst28.igst.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert onClose={handleCloseSnackbar} severity={feedback.severity} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default TransactionAdd;