import * as React from 'react';
import { useState, useEffect, FormEvent, useMemo } from "react";
import apiClient from "Services/apiService";
import storageUtils from '../../utils/storageUtils';
import PartSearch from '../../components/common/PartSearch';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  styled,
  Stack,
  Snackbar,
  Alert,
  Autocomplete,
  createFilterOptions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  FormControl,
  InputBase,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';

// Custom styled components for square inputs
const SquareTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
  },
  '& .MuiInputBase-input': {
    padding: '8px 12px',
  }
});

const SquareAutocomplete = styled(Autocomplete<Vendor, false, false, false>)({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
  },
  '& .MuiInputBase-input': {
    padding: '8px 12px',
  }
});

const SquareSelect = styled(Select)({
  borderRadius: 0,
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px',
  }
});

const SquareButton = styled(Button)({
  borderRadius: 0,
  textTransform: 'none',
  padding: '8px 16px',
});

const TableHeadCell = styled(TableCell)({
  padding: '8px',
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  fontSize: '0.8rem',
  '@media (max-width: 600px)': {
    padding: '4px',
    fontSize: '0.7rem',
  }
});

const TableBodyCell = styled(TableCell)({
  padding: '6px',
  border: '1px solid #ddd',
  fontSize: '0.8rem',
  '@media (max-width: 600px)': {
    padding: '4px 2px',
    fontSize: '0.7rem',
  }
});

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
  invoiceNo?: string;
  invoiceDate?: string;
}

interface SparePartTransactionDto {
  transactionId?: number;
  transactionType: "CREDIT" | "DEBIT";
  userId?: number;
  vehicleRegId?: number;
  vendorId?: number;
  sparePartId?: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: number;
  price: number;  // This should remain required as the API expects it
  qtyPrice?: number;
  billNo?: string;
  customerName?: string;
  updateAt?: string;
  transactionDate?: string;
  totalAmount?: number;
}

interface Feedback {
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

interface Vendor {
  vendorId: number;
  name: string;
  address?: string;
  mobile?: string;
  mobileNumber?: string; // Added for API compatibility
  gstin?: string;
  gstno?: string; // Added for API compatibility
  panNo?: string;
  spareBrand?: string;
}

interface SparePartDto {
  partName: string;
  partNumber: string;
  manufacturer: string;
  description?: string;  
  buyingPrice?: number;
  price?: number;
  sparePartId?: number;
}

interface SparePartItem {
  id: number;
  transactionId?: number;
  sparePartId?: number;
  barcode?: string;
  partName: string;
  partNumber: string;
  manufacturer?: string;
  price: number;
  quantity: number;
  rate?: number;
  gstPercentage: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  total: number;
  isEditing?: boolean;
  isSelected?: boolean;
  qtyPrice?: number;
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
  billNo: "1",
  name: "",
  gstPercentage: 0,
  taxableAmount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalAmount: 0,
  invoiceNo: "",
  invoiceDate: new Date().toISOString().split('T')[0]
};

const filterOptions = createFilterOptions<SparePartDto>({
  matchFrom: 'any',
  stringify: (option: SparePartDto) =>
    `${option.manufacturer} ${option.partName} ${option.partNumber} ${option.description || ""}`,
});

// Define types for our transaction processing
interface TransactionResult {
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: any;
  index: number;
}

// Add proper typing for API response
// Define a type for the API response
interface ApiResponse {
  status: number;
  data: any;
}

// Add a web worker for background processing of large batches
// This is a simple inline worker implementation that can be used without creating a separate file
const createBulkProcessingWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { transactions, chunkSize } = e.data;
      const chunks = [];
      
      // Split transactions into chunks
      for (let i = 0; i < transactions.length; i += chunkSize) {
        chunks.push(transactions.slice(i, i + chunkSize));
      }
      
      // Send back the chunked data
      self.postMessage({ 
        chunks,
        totalChunks: chunks.length,
        totalTransactions: transactions.length
      });
    }
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

const TransactionAdd: React.FC = () => {
  const [createData, setCreateData] = useState<CreateTransaction>(initialCreateData);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [sparePartItems, setSparePartItems] = useState<SparePartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<SparePartItem>>({
    id: 0,
    barcode: "",
    partName: "",
    quantity: 1,
    price: 0,
    rate: undefined,
    gstPercentage: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    total: 0
  });
  
  const [netTotal, setNetTotal] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);

  const navigate = useNavigate();

  let userRole: string = "";
  const userData = storageUtils.getUserData();
  if (userData) {
    userRole = userData.authorities?.[0] || "";
  }

  const memoizedVendorSuggestions = useMemo(() => {
    console.log("Vendor suggestions updated:", vendorSuggestions);
    return vendorSuggestions;
  }, [vendorSuggestions]);

  // Create a selected part state to pass to PartSearch
  const [selectedSearchPart, setSelectedSearchPart] = useState<SparePartDto | null>(null);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Add a debounce timer ref for API calls
  const updateTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Add state for managing the new part dialog
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);
  const [newPartData, setNewPartData] = useState({
    partName: "",
    description: "",
    manufacturer: "",
    price: 0,
    partNumber: "",
    sGST: 0,
    cGST: 0,
    totalGST: 0,
    quantity: 1,
    buyingPrice: 0
  });
  const [isCreatingPart, setIsCreatingPart] = useState(false);

  // List of GST values for dropdown
  const gstOptions = [0, 5, 12, 18, 28];

  // Add state for bulk import
  const [isImporting, setIsImporting] = useState(false);
  const [importedItems, setImportedItems] = useState<SparePartItem[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add state for batch operations menu
  const [batchAnchorEl, setBatchAnchorEl] = useState<null | HTMLElement>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Add search filter state
  const [tableFilter, setTableFilter] = useState('');

  // Add filtered items computation
  const filteredItems = useMemo(() => {
    if (!tableFilter.trim()) {
      return sparePartItems;
    }
    
    const searchTerm = tableFilter.toLowerCase();
    return sparePartItems.filter(item => 
      item.partName.toLowerCase().includes(searchTerm) ||
      item.partNumber.toLowerCase().includes(searchTerm) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm))
    );
  }, [sparePartItems, tableFilter]);

  // Add a state variable for the search term
  const [searchTerm, setSearchTerm] = useState('');

  // Add a state variable to track submission progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState({ current: 0, total: 0 });

  // Add this near the top of the component, after other useEffect hooks
  // Check for edit mode and load bill data if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editBillId = urlParams.get('edit');
    const isEditMode = !!editBillId;
    
    if (isEditMode) {
      // Try to get bill data from sessionStorage
      const storedBillData = sessionStorage.getItem('editBillData');
      if (storedBillData) {
        try {
          const billData = JSON.parse(storedBillData);
          console.log('Loading bill for editing:', billData);
          
          // Load vendor data
          if (billData.vendorId) {
            const vendor = vendorSuggestions.find(v => v.vendorId === billData.vendorId);
            if (vendor) {
              setSelectedVendor(vendor);
              setCreateData(prev => ({
                ...prev,
                name: vendor.name,
                vendorId: vendor.vendorId,
              }));
            }
          }
          
          // Set invoice details
          setCreateData(prev => ({
            ...prev,
            invoiceNo: billData.billNo || '',
            invoiceDate: billData.billDate ? new Date(billData.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          
          // Load items
          if (billData.items && Array.isArray(billData.items)) {
            const mappedItems: SparePartItem[] = billData.items.map((item: any, index: number) => ({
              id: index + 1,
              transactionId: item.transactionId,
              sparePartId: item.sparePartId,
              partName: item.itemName,
              partNumber: item.partNumber || '',
              manufacturer: item.manufacturer || '',
              price: item.mrp || item.price || 0,
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              gstPercentage: (item.cgstPercentage + item.sgstPercentage) || 0,
              taxableAmount: item.taxableAmount || (item.rate * item.quantity),
              cgst: item.cgst || 0,
              sgst: item.sgst || 0,
              total: item.amount || 0
            }));
            
            setSparePartItems(mappedItems);
            calculateTotals(mappedItems);
            
            // Set other bill totals
            setNetTotal(billData.subTotal || 0);
            setRoundOff(billData.roundOff || 0);
            setGrandTotal(billData.grandTotal || 0);
            setPaid(billData.paid || 0);
          }
        } catch (error) {
          console.error('Error parsing stored bill data:', error);
          setFeedback({
            message: "Failed to load bill data for editing",
            severity: "error"
          });
        }
      }
    }
  }, [vendorSuggestions]);

  useEffect(() => {
    console.log("Component mounted, fetching vendors...");
    fetchVendors();

    // Add a re-fetch mechanism if the first attempt gets no vendors
    const timeoutId = setTimeout(() => {
      if (vendorSuggestions.length === 0) {
        console.log("No vendors fetched in initial attempt, retrying...");
        fetchVendors();
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [vendorSuggestions.length]);

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get("/vendor/getAll");
      console.log("Vendors API response:", response);
      
      // More robust handling of different response structures
      let vendors: Vendor[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        vendors = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Check different possible locations of vendor data
        if (Array.isArray(response.data.vendors)) {
          vendors = response.data.vendors;
        } else if (Array.isArray(response.data.data)) {
          vendors = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.vendors)) {
          vendors = response.data.data.vendors;
        } else if (response.data.data && Array.isArray(response.data.data.content)) {
          vendors = response.data.data.content;
        } else if (Array.isArray(response.data.content)) {
          vendors = response.data.content;
        }
      }
      
      console.log("Extracted vendors:", vendors);
      if (vendors.length === 0) {
        console.warn("No vendors found in API response");
      }
      
      // Map API response fields to our interface fields
      const mappedVendors = vendors.map(vendor => ({
        ...vendor,
        // Map mobileNumber to mobile if mobile is not present
        mobile: vendor.mobile || vendor.mobileNumber?.toString(),
        // Map gstno to gstin if gstin is not present
        gstin: vendor.gstin || vendor.gstno
      }));
      
      setVendorSuggestions(mappedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setFeedback({
        message: "Failed to load supplier data. Please try refreshing the page.",
        severity: "error"
      });
    }
  };

  const handlePartSelect = (part: SparePartDto | null) => {
    setSelectedSearchPart(part); // Store the selected part
    
    if (part) {
      console.log("Selected part (full data):", part);
      console.log("Part buyingPrice:", part.buyingPrice);
      console.log("Part price:", part.price);
      console.log("Part sparePartId:", part.sparePartId);
      
      // Ensure we capture all possible price fields from the API
      const mrpValue = 
        part.buyingPrice !== undefined && part.buyingPrice !== null ? part.buyingPrice :
        part.price !== undefined && part.price !== null ? part.price : 0;
      
      console.log("Using MRP value:", mrpValue);
      
      setCurrentItem((prev) => {
        const updatedItem = {
        ...prev,
          partName: part.partName || "",
          partNumber: part.partNumber || "",
          sparePartId: part.sparePartId,
          price: mrpValue,
          rate: undefined, // Don't set rate automatically
        };
        console.log("Updated currentItem:", updatedItem);
        return updatedItem;
      });
    } else {
      setCurrentItem({
        id: 0,
        barcode: "",
        partName: "",
        quantity: 1,
        price: 0,
        rate: undefined, // Changed from 0 to undefined
        gstPercentage: 0,
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        total: 0
      });
    }
  };

  useEffect(() => {
    console.log("currentItem updated:", currentItem);
  }, [currentItem]);

  const handleSelectVendor = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: Vendor | null,
    reason?: string
  ) => {
    setSelectedVendor(newValue);
    setCreateData((prev) => ({
      ...prev,
      name: newValue ? newValue.name : "",
      vendorId: newValue ? newValue.vendorId : undefined,
    }));
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update the handleItemChange function to allow clearing values and fix TypeScript errors
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update the current item with the raw value (including empty string)
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate values if price, quantity or GST changes
    if (name === 'price' || name === 'quantity' || name === 'gstPercentage' || name === 'rate') {
      // Use the raw value for the changed field, and current values for the others
      const price = name === 'price' ? value : currentItem.price;
      const quantity = name === 'quantity' ? value : currentItem.quantity;
      const gstPercentage = name === 'gstPercentage' ? value : currentItem.gstPercentage;
      const rate = name === 'rate' ? value : currentItem.rate;
      
      // Only calculate if rate is not empty and is a number
      if (rate !== undefined && rate !== null && rate !== '') {
        const numRate = parseFloat(rate.toString());
        
        // Fix TypeScript errors with proper type checking
        const numQuantity = typeof quantity === 'string' ? 
          (quantity === '' ? 1 : parseFloat(quantity) || 1) : 
          (quantity || 1);
        
        const numGstPercentage = typeof gstPercentage === 'string' ? 
          (gstPercentage === '' ? 0 : parseFloat(gstPercentage) || 0) : 
          (gstPercentage || 0);
        
        if (!isNaN(numRate) && numRate > 0) {
          const taxableAmount = numRate * numQuantity;
          const gstAmount = (taxableAmount * numGstPercentage) / 100;
          const cgst = numGstPercentage > 0 ? gstAmount / 2 : 0;
          const sgst = numGstPercentage > 0 ? gstAmount / 2 : 0;
          const total = taxableAmount + gstAmount;
          
          console.log("Updated calculations:", {
            price, quantity, rate, gstPercentage, taxableAmount, cgst, sgst, total
          });
          
          setCurrentItem(prev => ({
            ...prev,
            taxableAmount,
            cgst,
            sgst,
            total
          }));
        }
      } else {
        // If rate is empty, clear calculated values
        setCurrentItem(prev => ({
          ...prev,
          taxableAmount: 0,
          cgst: 0,
          sgst: 0,
          total: 0
        }));
      }
    }
  };

  const addItemToList = () => {
    if (!currentItem.partName) {
      setFeedback({
        message: "Please select a spare part",
        severity: "error"
      });
      return;
    }

    console.log("Adding item with price:", currentItem.price);
    
    const price = currentItem.price || 0;
    const rate = currentItem.rate;
    const quantity = currentItem.quantity || 1;
    const gstPercentage = currentItem.gstPercentage || 0;
    
    // Calculate taxable amount only if rate is provided
    const taxableAmount = rate !== undefined ? rate * quantity : 0;
    
    // Calculate GST amounts only if rate is provided
    const gstAmount = rate !== undefined ? (taxableAmount * gstPercentage) / 100 : 0;
    const cgst = rate !== undefined && gstPercentage > 0 ? gstAmount / 2 : 0;
    const sgst = rate !== undefined && gstPercentage > 0 ? gstAmount / 2 : 0;
    
    // Calculate total only if rate is provided
    const total = rate !== undefined ? taxableAmount + gstAmount : 0;
    
    console.log("Item calculations:", {
      price,
      rate,
      quantity, 
      taxableAmount,
      gstPercentage,
      gstAmount,
      cgst,
      sgst,
      total
    });
    
    const newItem: SparePartItem = {
      id: sparePartItems.length + 1,
      sparePartId: currentItem.sparePartId,
      barcode: currentItem.barcode || "",
      partName: currentItem.partName || "",
      partNumber: currentItem.partNumber || "",
      manufacturer: selectedSearchPart?.manufacturer || "",
      price,
      quantity,
      rate,
      gstPercentage,
      taxableAmount,
      cgst,
      sgst,
      total
    };
    
    console.log("New item to add:", newItem);
    
    setSparePartItems(prev => {
      const updated = [...prev, newItem];
      console.log("Updated spareParts array:", updated);
      return updated;
    });
    
    // Calculate totals with the new item
    calculateTotals([...sparePartItems, newItem]);
    
    // Important: First store the part name for the success message
    const addedPartName = newItem.partName;
    
    // Reset search state first - this is critical to clear the PartSearch component
    setSelectedSearchPart(null);
    setSearchTerm("");
    
    // Reset current item state with default values
    setCurrentItem({
      id: 0,
      barcode: "",
      partName: "",
      partNumber: "",
      quantity: 1,
      price: 0,
      rate: undefined,
      gstPercentage: 0,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      total: 0
    });
    
    // Show success feedback
    setFeedback({
      message: `Added ${addedPartName} to the list`,
      severity: "success"
    });
  };

  const removeItem = (id: number) => {
    const updatedItems = sparePartItems.filter(item => item.id !== id);
    setSparePartItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: SparePartItem[]) => {
    console.log("Calculating totals for items:", items);
    
    // Calculate net total (sum of all item totals)
    const calculatedNetTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Round to 2 decimal places for display
    const roundedNetTotal = parseFloat(calculatedNetTotal.toFixed(2));
    
    // Calculate round off to nearest whole number
    const wholeNumberTotal = Math.round(calculatedNetTotal);
    const calculatedRoundOff = wholeNumberTotal - calculatedNetTotal;
    
    console.log("Total calculations:", {
      calculatedNetTotal,
      roundedNetTotal,
      wholeNumberTotal,
      calculatedRoundOff
    });
    
    setNetTotal(roundedNetTotal);
    setRoundOff(parseFloat(calculatedRoundOff.toFixed(2)));
    setGrandTotal(wholeNumberTotal);
  };

  // Modify the handleSubmit function to handle both create and update
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
      
    if (!selectedVendor) {
      setFeedback({
        message: "Please select a supplier",
        severity: "error"
      });
      return;
    }
      
    if (sparePartItems.length === 0) {
      setFeedback({
        message: "Please add at least one spare part",
        severity: "error"
      });
      return;
    }

    // Start submission process
    setIsSubmitting(true);
    
    try {
      // Check if we're in edit mode
      const urlParams = new URLSearchParams(window.location.search);
      const editBillId = urlParams.get('edit');
      const isEditMode = !!editBillId;
      
      // Prepare bill data
      const billData = {
        vendorId: selectedVendor.vendorId,
        vendorName: selectedVendor.name,
        billNo: createData.invoiceNo,
        billDate: createData.invoiceDate ? `${createData.invoiceDate}T00:00:00` : new Date().toISOString().split('.')[0],
        items: sparePartItems.map(item => ({
          itemName: item.partName,
          partNumber: item.partNumber,
          quantity: item.quantity,
          rate: item.rate || 0,
          cgstPercentage: item.gstPercentage / 2,
          sgstPercentage: item.gstPercentage / 2,
          amount: item.total,
          transactionId: item.transactionId
        })),
        subTotal: netTotal,
        totalCgst: sparePartItems.reduce((sum, item) => sum + item.cgst, 0),
        totalSgst: sparePartItems.reduce((sum, item) => sum + item.sgst, 0),
        roundOff: roundOff,
        grandTotal: grandTotal,
        paid: paid
      };
      
      let apiEndpoint = "/bills/create";
      let successMessage = "Bill created successfully!";
      let httpMethod = "post";
      
      // If in edit mode, update the bill instead of creating a new one
      if (isEditMode) {
        apiEndpoint = `/bills/update/${editBillId}`;
        successMessage = "Bill updated successfully!";
        httpMethod = "put"; // Use PUT method for updates
        
        // Add the bill ID to the data using type assertion
        (billData as any).billId = parseInt(editBillId);
      }
      
      console.log(`${isEditMode ? 'Updating' : 'Saving'} bill:`, billData);
      
      // Call the API to save/update the bill
      const billResponse = isEditMode 
        ? await apiClient.put(apiEndpoint, billData)  // Use PUT for updates
        : await apiClient.post(apiEndpoint, billData); // Use POST for creates
        
      console.log("Bill saved successfully:", billResponse.data);
      
      // Show success message
      setFeedback({
        message: successMessage,
        severity: "success"
      });
      
      // Reset form
      resetForm();
      
      // Redirect to purchase list page immediately
      navigate('/admin/purchase-list');
      
      // Process transactions in the background after redirection
      // This will continue even after the user is redirected
      setTimeout(() => {
        processTransactionsInBackground(sparePartItems, selectedVendor, createData);
      }, 100);
      
    } catch (billError: any) {
      console.error("Error saving bill:", billError);
      const isEditMode = window.location.search.includes('edit=');
      setFeedback({
        message: `Failed to ${isEditMode ? 'update' : 'create'} bill: ${billError.response?.data?.message || "Unknown error"}`,
        severity: "error"
      });
      setIsSubmitting(false);
    }
  };
  
  // New function to process transactions in background
  const processTransactionsInBackground = async (
    items: SparePartItem[], 
    vendor: Vendor, 
    formData: CreateTransaction
  ) => {
    try {
      // Process new transactions
      const newItems = items.filter(item => !item.transactionId);
      
      if (newItems.length === 0) return;
      
      // Optimize transaction data for minimal payload size
      const allTransactions = newItems.map(item => ({
        transactionType: "CREDIT" as const,
        userId: 10006,
        vendorId: vendor.vendorId,
        partNumber: item.partNumber,
        partName: item.partName,
        manufacturer: item.manufacturer || "",
        quantity: parseInt(item.quantity.toString()),
        price: typeof item.rate === 'number' ? item.rate : 0,
        billNo: formData.invoiceNo,
        name: vendor.name,
        gstPercentage: item.gstPercentage,
        ...(item.taxableAmount > 0 ? { taxableAmount: item.taxableAmount } : {}),
        ...(item.cgst > 0 ? { cgst: item.cgst } : {}),
        ...(item.sgst > 0 ? { sgst: item.sgst } : {})
      }));
      
      // Use larger batch sizes for faster processing
      const OPTIMAL_CHUNK_SIZE = Math.min(Math.max(Math.floor(newItems.length / 2), 20), 50);
      
      // Create bulk request data
      const bulkRequestData = {
        vendorId: vendor.vendorId,
        invoiceNo: formData.invoiceNo,
        invoiceDate: formData.invoiceDate
      };
      
      // Split transactions into chunks
      const chunks: Array<typeof allTransactions> = [];
      for (let i = 0; i < allTransactions.length; i += OPTIMAL_CHUNK_SIZE) {
        chunks.push(allTransactions.slice(i, i + OPTIMAL_CHUNK_SIZE));
      }
      
      console.log(`Background processing: ${chunks.length} chunks of transactions`);
      
      // Process all chunks in parallel for maximum speed
      const chunkPromises = chunks.map(async (chunkTransactions, index) => {
        const chunkRequestData = {
          ...bulkRequestData,
          transactions: chunkTransactions
        };
        
        try {
          const response = await apiClient.post("/sparePartTransactions/bulkAdd", chunkRequestData, {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Batch-Optimization': 'true',
              'X-Batch-Number': `${index + 1}`,
              'X-Total-Batches': `${chunks.length}`
            }
    });
    
    return {
            success: true,
            count: chunkTransactions.length,
            chunkNum: index + 1
          };
        } catch (error) {
          console.error(`Error processing chunk ${index + 1}:`, error);
          return {
            success: false,
            count: 0,
            chunkNum: index + 1,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      });
      
      // Wait for all chunks to complete
      const results = await Promise.all(chunkPromises);
      
      const successCount = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0);
      const failureCount = allTransactions.length - successCount;
      
      console.log(`Background processing complete: ${successCount} succeeded, ${failureCount} failed`);
      
    } catch (error) {
      console.error("Error in background transaction processing:", error);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return; // Don't close the snackbar when clicking away
    }
    setFeedback(null);
  };

  const handleManagePurchase = () => {
    navigate('/admin/purchase-list');
  };

  // Function to reset the form
  const resetForm = () => {
    setCreateData(initialCreateData);
    setSparePartItems([]);
    setSelectedVendor(null);
    setNetTotal(0);
    setGrandTotal(0);
    setRoundOff(0);
    setPaid(0);
    setSelectedItems([]);
    setSearchTerm("");
    setSelectedSearchPart(null);
  };

  const toggleEditMode = (id: number) => {
    setSparePartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, isEditing: !item.isEditing } 
          : item
      )
    );
  };

  // Update the handleTableCellChange function to allow clearing values
  const handleTableCellChange = (id: number, field: keyof SparePartItem, value: string | number) => {
    setSparePartItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === id) {
          // Allow empty string values
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate values if rate or quantity changes
          if (field === 'rate' || field === 'quantity') {
            const rate = field === 'rate' ? value : item.rate;
            const quantity = field === 'quantity' ? value : item.quantity;
            
            // Only calculate if rate is defined and not empty
            if (rate !== undefined && rate !== null && rate !== '') {
              // Calculate with proper number conversions
              const numRate = rate === '' ? 0 : (typeof rate === 'string' ? parseFloat(rate) : rate) || 0;
              const numQuantity = quantity === '' ? 1 : (typeof quantity === 'string' ? parseFloat(quantity) : quantity) || 1;
              
              // Calculate taxable amount (rate * quantity)
              const taxableAmount = numRate * numQuantity;
              
              // Calculate GST amounts
              const numGstPercentage = typeof item.gstPercentage === 'string' ? parseFloat(item.gstPercentage) || 0 : (item.gstPercentage || 0);
              const gstAmount = (taxableAmount * numGstPercentage) / 100;
              const cgst = numGstPercentage > 0 ? gstAmount / 2 : 0;
              const sgst = numGstPercentage > 0 ? gstAmount / 2 : 0;
              
              // Calculate total (taxable + GST)
              const total = taxableAmount + gstAmount;
              
              console.log("Recalculated values:", {
                rate,
                quantity,
      taxableAmount,
                gstPercentage: item.gstPercentage,
                gstAmount,
      cgst,
      sgst,
                total
              });
              
              // If this item has a transactionId, debounce the API call to avoid too many requests
              if (item.transactionId && !isUpdating) {
                // Clear previous timer if it exists
                if (updateTimerRef.current) {
                  clearTimeout(updateTimerRef.current);
                }
                
                // Set new timer to call the API after a delay
                updateTimerRef.current = setTimeout(() => {
                  updateTransactionQuantity(item.transactionId as number, {
                    ...updatedItem,
                    taxableAmount,
                    cgst,
                    sgst,
                    total
                  });
                  updateTimerRef.current = null;
                }, 1000); // 1 second delay
              }
    
              return {
                ...updatedItem,
                taxableAmount,
                cgst,
                sgst,
                total
              };
            } else {
              // If rate is undefined or empty, set calculated values to 0
              return {
                ...updatedItem,
                taxableAmount: 0,
                cgst: 0,
                sgst: 0,
                total: 0
              };
            }
          }
          
          // Return the updated item with the new field value
          return item;
        }
        
        // Return the original item unchanged
        return item;
      });
      
      // Recalculate totals after updating an item
      calculateTotals(updatedItems);
      
      return updatedItems;
    });
  };
  
  const updateTransactionQuantity = async (transactionId: number, item: SparePartItem) => {
    setIsUpdating(true);
    try {
      // Get a safe price value, defaulting to 0 if undefined
      const safePrice = Number(item.rate || 0);
      
      // Prepare the DTO for the update API call
      const transactionDto: SparePartTransactionDto = {
        transactionId: transactionId,
        transactionType: "CREDIT", // Assuming this is a purchase transaction
        partNumber: item.partNumber,
        partName: item.partName,
        manufacturer: item.manufacturer || "",
        quantity: item.quantity,
        price: safePrice, // Using rate as the price, guaranteed to be a number
        sparePartId: item.sparePartId,
        
        // Include all required fields from the SparePartTransactionDto interface
        billNo: createData.billNo,
        customerName: selectedVendor?.name || "",
        updateAt: new Date().toISOString(),
        qtyPrice: item.taxableAmount,
        
        // Add any other fields required by your backend API
        userId: 10006,
        totalAmount: item.total
      };
      
      console.log("Updating transaction with data:", transactionDto);
      
      const response = await apiClient.put(
        `/sparePartTransactions/update?transactionId=${transactionId}`, 
        transactionDto
      );
      
      console.log("Transaction update response:", response.data);
      
      setFeedback({
        message: "Transaction updated successfully",
        severity: "success"
      });
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      setFeedback({
        message: error.response?.data?.message || "Failed to update transaction",
        severity: "error"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSelectItem = (id: number) => {
    setSparePartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, isSelected: !item.isSelected } 
          : item
      )
    );
    
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleDeleteClick = (transactionId?: number) => {
    if (!transactionId) {
      setFeedback({
        message: "Cannot delete: No transaction ID found",
        severity: "error"
      });
      return;
    }
    
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (transactionToDelete === null) {
      // This is a bulk delete operation
      const transactionIds = sparePartItems
        .filter(item => item.isSelected && item.transactionId)
        .map(item => item.transactionId as number);
      
      if (transactionIds.length > 0) {
        await bulkDeleteTransactions(transactionIds);
      }
    } else if (transactionToDelete) {
      // This is a single delete operation
      try {
        console.log("Deleting transaction ID:", transactionToDelete);
        
        // Call the API to delete the transaction using the correct endpoint
        const response = await apiClient.delete(
          `/sparePartTransactions/delete?transactionId=${transactionToDelete}`
        );
        
        console.log("Delete response:", response.data);
        
        // Remove the item from the list
        const updatedItems = sparePartItems.filter(item => item.transactionId !== transactionToDelete);
        setSparePartItems(updatedItems);
        calculateTotals(updatedItems);
        
        setFeedback({
          message: "Transaction deleted successfully",
          severity: "success"
        });
      } catch (error: any) {
        console.error("Error deleting transaction:", error);
        setFeedback({
          message: error.response?.data?.message || "Failed to delete transaction",
          severity: "error"
        });
      }
    }
    
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };
  
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleRemoveSelected = () => {
    const selectedTransactions = sparePartItems
      .filter(item => item.isSelected && item.transactionId)
      .map(item => item.transactionId as number);
    
    if (selectedTransactions.length === 0) {
      // If no transaction has a transactionId, check if any items are selected
      const selectedItems = sparePartItems.filter(item => item.isSelected);
      
      if (selectedItems.length > 0) {
        // Remove the selected items from the UI only (they aren't saved to the database yet)
        const updatedItems = sparePartItems.filter(item => !item.isSelected);
        setSparePartItems(updatedItems);
        calculateTotals(updatedItems);
        setFeedback({
          message: "Selected items removed",
          severity: "info"
        });
        return;
      }
      
      // No items selected at all
      setFeedback({
        message: "Please select at least one item to remove",
        severity: "error"
      });
      return;
    }
    
    // If only one transaction is selected, use the single delete flow
    if (selectedTransactions.length === 1) {
      handleDeleteClick(selectedTransactions[0]);
      return;
    }
    
    // For multiple transactions, show confirmation dialog
    setIsDeleteDialogOpen(true);
    setTransactionToDelete(null); // Using null to indicate bulk delete
  };

  // 2. Optimize the bulkUpdateTransactions function for speed
  const bulkUpdateTransactions = async (items: SparePartItem[]) => {
    if (items.length === 0) return;

    const validItems = items.filter(item => item.transactionId);
    
    // Start submission process
    setIsSubmitting(true);
    setSubmissionProgress({ current: 0, total: validItems.length });
    
    // Use larger batch sizes for speed
    const BATCH_SIZE = validItems.length > 100 ? 30 : validItems.length > 50 ? 20 : 15;
    
    try {
      // Show initial progress message
      setFeedback({
        message: `Updating ${validItems.length} items...`,
        severity: "info"
      });
      
      // Prepare all transaction data upfront
      const updateTransactions = validItems.map(item => ({
        dto: {
          transactionId: item.transactionId,
          transactionType: "CREDIT",
          partNumber: item.partNumber,
          partName: item.partName,
          manufacturer: item.manufacturer || "",
          quantity: item.quantity,
          price: item.rate !== undefined ? item.rate : 0,
          sparePartId: item.sparePartId,
          qtyPrice: item.taxableAmount,
        },
        url: `/sparePartTransactions/update?transactionId=${item.transactionId}`
      }));
      
      // Track start time
      const startTime = Date.now();
      
      // Process in parallel batches
      const results = [];
      for (let i = 0; i < updateTransactions.length; i += BATCH_SIZE) {
        const batch = updateTransactions.slice(i, i + BATCH_SIZE);
        
        // Create batch of promises - all executing in parallel
        const batchPromises = batch.map(transaction => 
          apiClient.put(transaction.url, transaction.dto)
        );
        
        // Execute all promises in this batch concurrently 
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Update progress
        setSubmissionProgress({
          current: Math.min(i + BATCH_SIZE, updateTransactions.length),
          total: updateTransactions.length
        });
      }
      
      // Track end time
      const endTime = Date.now();
      
      // Count successes and failures
      const succeeded = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Total update time: ${(endTime - startTime) / 1000} seconds`);
      
      if (failed > 0) {
        setFeedback({
          message: `${succeeded} transactions updated successfully, ${failed} failed (in ${(endTime - startTime) / 1000}s)`,
          severity: "warning"
        });
      } else {
        setFeedback({
          message: `All ${succeeded} transactions updated successfully (in ${(endTime - startTime) / 1000}s)`,
          severity: "success"
        });
      }
    } catch (error: any) {
      console.error("Error during bulk update:", error);
      setFeedback({
        message: "Failed to update some transactions",
        severity: "error"
      });
    } finally {
      // Reset submission state
      setIsSubmitting(false);
      setSubmissionProgress({ current: 0, total: 0 });
    }
  };

  // 3. Optimize the bulkDeleteTransactions function for speed
  const bulkDeleteTransactions = async (transactionIds: number[]) => {
    if (transactionIds.length === 0) return;
    
    // Start submission process
    setIsSubmitting(true);
    setSubmissionProgress({ current: 0, total: transactionIds.length });
    
    // Use larger batch sizes for speed
    const BATCH_SIZE = transactionIds.length > 100 ? 30 : transactionIds.length > 50 ? 20 : 15;
    
    try {
      // Show initial progress message
      setFeedback({
        message: `Deleting ${transactionIds.length} items...`,
        severity: "info"
      });
      
      // Track start time
      const startTime = Date.now();
      
      // Process in parallel batches
      const results = [];
      for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
        const batch = transactionIds.slice(i, i + BATCH_SIZE);
        
        // Create batch of promises - all executing in parallel
        const batchPromises = batch.map(id => 
          apiClient.delete(`/sparePartTransactions/delete?transactionId=${id}`)
        );
        
        // Execute all promises in this batch concurrently
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Update progress
        setSubmissionProgress({
          current: Math.min(i + BATCH_SIZE, transactionIds.length),
          total: transactionIds.length
        });
        
        // Update the UI by removing deleted items for this batch
        const deletedIds = new Set(
          batch.filter((id, index) => batchResults[index].status === 'fulfilled')
        );
        
        setSparePartItems(prev => 
          prev.filter(item => !item.transactionId || !deletedIds.has(item.transactionId))
        );
      }
      
      // Track end time
      const endTime = Date.now();
      
      // Recalculate totals after removing items
      const updatedItems = sparePartItems.filter(item => 
        !item.transactionId || !transactionIds.includes(item.transactionId)
      );
      calculateTotals(updatedItems);
      
      // Count successes and failures
      const succeeded = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Total delete time: ${(endTime - startTime) / 1000} seconds`);
      
      if (failed > 0) {
        setFeedback({
          message: `${succeeded} transactions deleted successfully, ${failed} failed (in ${(endTime - startTime) / 1000}s)`,
          severity: "warning"
        });
      } else {
        setFeedback({
          message: `All ${succeeded} transactions deleted successfully (in ${(endTime - startTime) / 1000}s)`,
          severity: "success"
        });
      }
    } catch (error: any) {
      console.error("Error during bulk delete:", error);
      setFeedback({
        message: "Failed to delete some transactions",
        severity: "error"
      });
    } finally {
      // Reset submission state
      setIsSubmitting(false);
      setSubmissionProgress({ current: 0, total: 0 });
    }
  };

  // Function to handle opening new part dialog
  const handleOpenNewPartDialog = (searchTerm: string = "") => {
    // Initialize with the search term if provided
    setNewPartData({
      ...newPartData,
      partName: searchTerm || "",
      partNumber: searchTerm ? generatePartNumber(searchTerm) : "",
      manufacturer: "",
      description: "",
      price: 0,
      buyingPrice: 0,
      sGST: 0,
      cGST: 0,
      totalGST: 0,
      quantity: 1
    });
    
    // Always open the dialog, even if no search term is provided
    setIsNewPartDialogOpen(true);
  };

  // Function to generate a part number from part name
  const generatePartNumber = (partName: string): string => {
    // Create a simple part number based on the part name
    // e.g. "Brake Pad" -> "BRK-PAD-001"
    const words = partName.trim().split(/\s+/);
    let prefix = "";
    
    if (words.length > 0) {
      // Take first 3 letters of each word and capitalize
      prefix = words.map(word => (word.length > 0 ? word.substring(0, Math.min(3, word.length)).toUpperCase() : "")).join("-");
    }
    
    // Add random 3-digit number
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return prefix + "-" + randomNum;
  };

  // Function to handle new part creation
  const handleNewPartSubmit = async () => {
    setIsCreatingPart(true);
    
    // Cache form data to local variables before API call
    const partData = { ...newPartData };
    
    // Validate required fields
    if (!partData.partName || !partData.partNumber || !partData.manufacturer) {
      setFeedback({
        message: "Please fill all required fields",
        severity: "error"
      });
      setIsCreatingPart(false);
      return;
    }
    
    // Generate a temporary ID for optimistic update
    const tempId = Date.now();
    
    // Create the part object for optimistic update
    const optimisticPart: SparePartDto = {
      partName: partData.partName,
      partNumber: partData.partNumber,
      manufacturer: partData.manufacturer,
      description: partData.description,
      buyingPrice: partData.buyingPrice,
      price: partData.price,
      sparePartId: tempId // Temporary ID
    };
    
    // Create table item for optimistic update
    const optimisticItem: SparePartItem = {
      id: sparePartItems.length + 1,
      sparePartId: tempId,
      partName: partData.partName,
      partNumber: partData.partNumber,
      manufacturer: partData.manufacturer,
      price: partData.price || 0,
      quantity: 1,
      rate: partData.price || 0,
      gstPercentage: partData.totalGST,
      taxableAmount: partData.price || 0,
      cgst: partData.totalGST > 0 ? ((partData.price || 0) * partData.totalGST / 100) / 2 : 0,
      sgst: partData.totalGST > 0 ? ((partData.price || 0) * partData.totalGST / 100) / 2 : 0,
      total: (partData.price || 0) * (1 + partData.totalGST / 100)
    };
    
    // Close the dialog immediately
    setIsNewPartDialogOpen(false);
    
    // Reset form data immediately
    setNewPartData({
      partName: "",
      description: "",
      manufacturer: "",
      price: 0,
      partNumber: "",
      sGST: 0,
      cGST: 0,
      totalGST: 0,
      quantity: 1,
      buyingPrice: 0
    });
    
    // Add to table immediately (optimistic update)
    setSparePartItems(prev => [...prev, optimisticItem]);
    calculateTotals([...sparePartItems, optimisticItem]);
    
    // Show loading feedback
    setFeedback({
      message: "Adding part to table and saving to database...",
      severity: "info"
    });
    
    // Prepare form data for API call
    const formData = new FormData();
    formData.append("partName", partData.partName);
    formData.append("description", partData.description || "");
    formData.append("manufacturer", partData.manufacturer);
    formData.append("price", partData.price.toString());
    formData.append("partNumber", partData.partNumber);
    formData.append("sGST", partData.sGST.toString());
    formData.append("cGST", partData.cGST.toString());
    formData.append("totalGST", partData.totalGST.toString());
    formData.append("quantity", partData.quantity.toString());
    formData.append("buyingPrice", partData.buyingPrice.toString());
    
    // Add empty photo since the API requires it
    const emptyBlob = new Blob([""], { type: "application/octet-stream" });
    formData.append("photos", new File([emptyBlob], "placeholder.jpg"));
    
    try {
      // Call the API to create the part with a shorter timeout
      const response = await apiClient.post("/sparePartManagement/addPart", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 8000 // Set timeout to 8 seconds
      });
      
      // If successful, update the temporary ID with the real one
      const realId = response.data.sparePartId || tempId;
      
      // Update the item in the table with the real ID
      setSparePartItems(prev => 
        prev.map(item => 
          item.sparePartId === tempId 
            ? { ...item, sparePartId: realId } 
            : item
        )
      );
      
      // Show success message
      setFeedback({
        message: "Part added successfully",
        severity: "success"
      });
      
    } catch (error: any) {
      console.error("Error creating new part:", error);
      
      // Check if the error is due to timeout
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      
      if (isTimeout) {
        // For timeouts, assume the part might have been created
        setFeedback({
          message: "Part may have been created but response timed out. Part added to table.",
          severity: "warning"
        });
      } else {
        // For other errors, check if it's actually a duplicate (which means the part was created)
        const errorMessage = error.response?.data?.message || "Unknown error";
        const isDuplicate = errorMessage.toLowerCase().includes('duplicate') || 
                          errorMessage.toLowerCase().includes('already exists');
        
        if (isDuplicate) {
          // If it's a duplicate, the part probably exists, so keep it in the table
          setFeedback({
            message: "Part may already exist in database. Part added to table.",
            severity: "warning"
          });
        } else {
          // For other errors, show the error but keep the part in the table
          setFeedback({
            message: `API error: ${errorMessage}. Part still added to table.`,
            severity: "warning"
          });
        }
      }
    } finally {
      setIsCreatingPart(false);
    }
  };

  // Function to handle change in new part data
  const handleNewPartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for GST fields
    if (name === "totalGST") {
      const totalGST = parseInt(value);
      // Divide by 2 for CGST and SGST
      const halfGST = totalGST > 0 ? totalGST / 2 : 0;
      
      setNewPartData(prev => ({
      ...prev,
        [name]: totalGST,
        sGST: halfGST,
        cGST: halfGST
      }));
    } else {
      setNewPartData(prev => ({
        ...prev,
        [name]: ["price", "sGST", "cGST", "totalGST", "quantity", "buyingPrice"].includes(name) 
          ? parseInt(value) || 0 
          : value
      }));
    }
  };

  // Function to handle change of GST percentage from dropdown
  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const gstPercentage = parseInt(e.target.value) || 0;
    const price = currentItem.price || 0;
    const quantity = currentItem.quantity || 1;
    
    const taxableAmount = price * quantity;
    const gstAmount = (taxableAmount * gstPercentage) / 100;
    const cgst = gstPercentage > 0 ? gstAmount / 2 : 0;
    const sgst = gstPercentage > 0 ? gstAmount / 2 : 0;
    const total = taxableAmount + gstAmount;
    
    setCurrentItem(prev => ({
      ...prev,
      gstPercentage,
      taxableAmount,
      cgst,
      sgst,
      total
    }));
  };

  // Function to handle bulk import from CSV
  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        
        // Simple CSV parsing
        const rows = csvData.split('\n');
        const headers = rows[0].split(',').map(header => header.trim());
        
        // Process the imported data
        const newItems: SparePartItem[] = [];
        let validRows = 0;
        let invalidRows = 0;
        
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const values = rows[i].split(',').map(value => value.trim());
          const rowData: Record<string, string> = {};
          
          // Map CSV columns to object properties
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          // Check if required fields are present
          if (!rowData['Part Name'] || !rowData['Rate']) {
            invalidRows++;
            continue;
          }
          
          const partName = rowData['Part Name'];
          const partNumber = rowData['Part Number'] || generatePartNumber(partName);
          const manufacturer = rowData['Manufacturer'] || "";
          const price = parseFloat(rowData['MRP']) || 0;
          const rate = parseFloat(rowData['Rate']) || price;
          const quantity = parseInt(rowData['Quantity']) || 1;
          const gstPercentage = parseInt(rowData['GST%']) || 0;
          
          // Calculate values
          const taxableAmount = rate * quantity;
          const gstAmount = (taxableAmount * gstPercentage) / 100;
          const cgst = gstPercentage > 0 ? gstAmount / 2 : 0;
          const sgst = gstPercentage > 0 ? gstAmount / 2 : 0;
          const total = taxableAmount + gstAmount;
          
          const newItem: SparePartItem = {
            id: sparePartItems.length + newItems.length + 1,
            partName,
            partNumber,
            manufacturer,
            price,
            rate,
      quantity,
            gstPercentage,
            taxableAmount,
            cgst,
            sgst,
            total
          };
          
          newItems.push(newItem);
          validRows++;
        }
        
        // Update state with imported items
        setImportedItems(newItems);
        setSparePartItems(prev => [...prev, ...newItems]);
        calculateTotals([...sparePartItems, ...newItems]);
        
        setFeedback({
          message: `Successfully imported ${validRows} items. ${invalidRows} rows were invalid.`,
          severity: invalidRows > 0 ? "warning" : "success"
        });
        
      } catch (error) {
        console.error("Error importing file:", error);
        setFeedback({
          message: "Failed to import file. Please check the file format.",
          severity: "error"
        });
      } finally {
        setIsImporting(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    
    reader.onerror = () => {
      setFeedback({
        message: "Error reading file",
        severity: "error"
      });
      setIsImporting(false);
    };
    
    // Read as text for CSV parsing
    reader.readAsText(file);
  };

  // Function to trigger file input click
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to download sample template as CSV
  const downloadSampleTemplate = () => {
    const headers = ['Part Name', 'Part Number', 'Manufacturer', 'MRP', 'Rate', 'Quantity', 'GST%'];
    const sampleData = ['Example Part', 'EX-PART-001', 'Example Manufacturer', '1000', '900', '1', '18'];
    
    let csvContent = headers.join(',') + '\n';
    csvContent += sampleData.join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parts_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to open batch operations menu
  const handleBatchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBatchAnchorEl(event.currentTarget);
  };

  // Function to close batch operations menu
  const handleBatchMenuClose = () => {
    setBatchAnchorEl(null);
  };

  // Function to handle batch update of GST percentage
  const handleBatchUpdateGST = async (gstValue: number) => {
    if (selectedItems.length === 0) {
      setFeedback({
        message: "Please select at least one item to update",
        severity: "error"
      });
      return;
    }
    
    setBatchProcessing(true);
    
    try {
      // Update GST for selected items
      const updatedItems = sparePartItems.map(item => {
        if (selectedItems.includes(item.id)) {
          // Only update if rate is defined
          if (item.rate !== undefined) {
            // Calculate new values based on the new GST percentage
            const taxableAmount = item.rate * item.quantity;
            const gstAmount = (taxableAmount * gstValue) / 100;
            const cgst = gstValue > 0 ? gstAmount / 2 : 0;
            const sgst = gstValue > 0 ? gstAmount / 2 : 0;
            const total = taxableAmount + gstAmount;
            
            return {
              ...item,
              gstPercentage: gstValue,
              taxableAmount,
              cgst,
              sgst,
              total
            };
          }
          // If rate is undefined, just update the GST percentage
          return {
            ...item,
            gstPercentage: gstValue
          };
        }
        return item;
      });
      
      // Update state with the modified items
      setSparePartItems(updatedItems);
      calculateTotals(updatedItems);
      
      // If any selected items have transaction IDs, update them in the database
      const itemsToUpdate = updatedItems.filter(
        item => selectedItems.includes(item.id) && item.transactionId
      );
      
      if (itemsToUpdate.length > 0) {
        await bulkUpdateTransactions(itemsToUpdate);
      }
      
        setFeedback({
        message: `Updated GST to ${gstValue}% for ${selectedItems.length} items`,
        severity: "success"
      });
    } catch (error) {
      console.error("Error in batch GST update:", error);
      setFeedback({
        message: "Failed to update GST for some items",
          severity: "error"
        });
    } finally {
      setBatchProcessing(false);
      setBatchAnchorEl(null);
      }
  };
      
  // Function to handle batch update of prices
  const handleBatchUpdatePrices = async (percentageChange: number) => {
    if (selectedItems.length === 0) {
        setFeedback({
        message: "Please select at least one item to update",
          severity: "error"
        });
        return;
      }
      
    setBatchProcessing(true);
    
    try {
      // Update prices for selected items
      const updatedItems = sparePartItems.map(item => {
        if (selectedItems.includes(item.id)) {
          // Only update if rate is defined
          if (item.rate !== undefined) {
            // Calculate new rate based on percentage change
            const newRate = item.rate * (1 + percentageChange / 100);
            
            // Recalculate all values
            const taxableAmount = newRate * item.quantity;
            const gstAmount = (taxableAmount * item.gstPercentage) / 100;
            const cgst = item.gstPercentage > 0 ? gstAmount / 2 : 0;
            const sgst = item.gstPercentage > 0 ? gstAmount / 2 : 0;
            const total = taxableAmount + gstAmount;
            
            return {
              ...item,
              rate: parseFloat(newRate.toFixed(2)),
              taxableAmount,
              cgst,
              sgst,
              total
            };
          }
          return item;
        }
        return item;
      });
      
      // Update state with the modified items
      setSparePartItems(updatedItems);
      calculateTotals(updatedItems);
      
      // If any selected items have transaction IDs, update them in the database
      const itemsToUpdate = updatedItems.filter(
        item => selectedItems.includes(item.id) && item.transactionId
      );
      
      if (itemsToUpdate.length > 0) {
        await bulkUpdateTransactions(itemsToUpdate);
      }
      
      const changeText = percentageChange >= 0 ? `increased by ${percentageChange}%` : `decreased by ${Math.abs(percentageChange)}%`;
      
      setFeedback({
        message: `Prices ${changeText} for ${selectedItems.length} items`,
        severity: "success"
      });
    } catch (error) {
      console.error("Error in batch price update:", error);
      setFeedback({
        message: "Failed to update prices for some items",
        severity: "error"
      });
    } finally {
      setBatchProcessing(false);
      setBatchAnchorEl(null);
    }
  };

  // Add function to handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select all items
      const allItemIds = sparePartItems.map(item => item.id);
      setSelectedItems(allItemIds);
      setSparePartItems(prev => 
        prev.map(item => ({ ...item, isSelected: true }))
      );
    } else {
      // Deselect all items
      setSelectedItems([]);
      setSparePartItems(prev => 
        prev.map(item => ({ ...item, isSelected: false }))
      );
    }
  };

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if ctrl or cmd key is pressed
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (ctrlOrCmd) {
        switch (e.key) {
          case 'a':
            // Ctrl+A: Select all items
            e.preventDefault();
            if (sparePartItems.length > 0) {
              const allItemIds = sparePartItems.map(item => item.id);
              setSelectedItems(allItemIds);
              setSparePartItems(prev => 
                prev.map(item => ({ ...item, isSelected: true }))
              );
            }
            break;
            
          case 'd':
            // Ctrl+D: Deselect all items
            e.preventDefault();
            setSelectedItems([]);
            setSparePartItems(prev => 
              prev.map(item => ({ ...item, isSelected: false }))
            );
            break;
            
          case 'i':
            // Ctrl+I: Open import dialog
            e.preventDefault();
            openFileSelector();
            break;
            
          case 's':
            // Ctrl+S: Submit form
            e.preventDefault();
            document.getElementById('transaction-form')?.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true })
            );
            break;
            
          case 'Delete':
            // Ctrl+Delete: Remove selected items
            e.preventDefault();
            if (selectedItems.length > 0) {
              handleRemoveSelected();
            }
            break;
            
          default:
            break;
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sparePartItems, selectedItems, openFileSelector, handleRemoveSelected]);

  // Remove the duplicatePartForTesting function
  const duplicatePartForTesting = () => {};

  // Remove the testing dialog and related functionality
  const [isTestingDialogOpen, setIsTestingDialogOpen] = useState(false);
  const [testingCount, setTestingCount] = useState(80);
  const [selectedPartForTesting, setSelectedPartForTesting] = useState<SparePartItem | null>(null);

  // Replace the openTestingDialog function with an empty function
  const openTestingDialog = () => {};

  // Replace the handleTestingDuplicate function with an empty function
  const handleTestingDuplicate = () => {};

  // Remove the renderTestingButton function
  const renderTestingButton = () => null;

  // Replace the TestingDialogComponent with an empty component
  const TestingDialogComponent = () => null;

  // Function to navigate to discount management page
  const handleManageDiscount = () => {
    navigate('/admin/manage-discounts');
  };

  return (
    <Box
      component="form"
      id="transaction-form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        p: { xs: 0.5, sm: 2 }, // Reduce padding on mobile
        gap: { xs: 1, sm: 2 }, // Reduce gap on mobile
        overflowX: 'hidden', // Prevent horizontal scrolling on mobile
        // Add global styles here instead of using style tag
        '& .MuiAutocomplete-popper': {
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 'none' }
        }
      }}
    >
      {/* Remove the invalid style jsx tag */}

      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent={{ xs: 'center', sm: 'flex-end' }} 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1} 
        mb={1}
        sx={{ px: { xs: 1, sm: 0 } }} // Add padding on mobile
      >
        <SquareButton 
          variant="contained" 
          color="secondary"
          onClick={() => handleOpenNewPartDialog(searchTerm)}
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
            fontWeight: 'bold',
            width: { xs: '100%', sm: 'auto' }, // Full width on mobile
            height: '40px' // Ensure consistent height
          }}
        >
          Add Part
        </SquareButton>
        <SquareButton 
          variant="contained" 
          color="primary"
          onClick={handleManagePurchase}
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            width: { xs: '100%', sm: 'auto' }, // Full width on mobile
            height: '40px' // Ensure consistent height
          }}
        >
          Manage Purchase
        </SquareButton>
        <SquareButton 
          variant="contained" 
          color="secondary" 
          onClick={handleManageDiscount}
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            width: { xs: '100%', sm: 'auto' },
            height: '40px',
            ml: { xs: 0, sm: 1 },
            mt: { xs: 1, sm: 0 },
            background: (theme) => theme.palette.secondary.main,
            '&:hover': {
              background: (theme) => theme.palette.secondary.dark,
            },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          Manage Discount
        </SquareButton>
      </Stack>

      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ px: { xs: 1, sm: 0 } }}>
        {/* Invoice Details Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Invoice Details
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  Invoice No. <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareTextField
                    fullWidth
                    size="small"
                    name="invoiceNo"
                    value={createData.invoiceNo}
                    onChange={handleCreateChange}
                    placeholder="Enter Invoice No."
                    required
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  Inv. Date <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareTextField
                    fullWidth
                    size="small"
                    name="invoiceDate"
                    type="date"
                    value={createData.invoiceDate}
                    onChange={handleCreateChange}
                    required
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Supplier Details Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' }, mt: { xs: 2, md: 0 } }}>
            Supplier Details
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  Name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareAutocomplete
                    fullWidth
                    size="small"
              disablePortal
              options={memoizedVendorSuggestions}
                    getOptionLabel={(option: Vendor) => option.name || ""}
              onChange={handleSelectVendor}
              value={selectedVendor}
                    isOptionEqualToValue={(option: Vendor, value: Vendor) => {
                      if (!option || !value) return false;
                      return option.vendorId === value.vendorId;
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        placeholder="Select / Enter Supplier Name"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {memoizedVendorSuggestions.length === 0 ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  Address
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareTextField
                    fullWidth
              size="small"
                    multiline
                    rows={2}
                    name="address"
                    value={selectedVendor?.address || ""}
                    placeholder="Enter Supplier Address"
                    disabled={!selectedVendor}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  Mobile No
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareTextField
                    fullWidth
              size="small"
                    name="mobile"
                    value={selectedVendor?.mobile || selectedVendor?.mobileNumber?.toString() || ""}
                    onChange={(e) => {
                      if (selectedVendor) {
                        setSelectedVendor({
                          ...selectedVendor,
                          mobile: e.target.value
                        });
                      }
                    }}
                    placeholder="Enter Supplier Mobile No."
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography sx={{ 
                  width: { xs: '100%', sm: '120px' }, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
                  mb: { xs: 0.5, sm: 0 } 
                }}>
                  GSTIN
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <SquareTextField
                    fullWidth
              size="small"
                    name="gstin"
                    value={selectedVendor?.gstin || selectedVendor?.gstno || ""}
                    onChange={(e) => {
                      if (selectedVendor) {
                        setSelectedVendor({
                          ...selectedVendor,
                          gstin: e.target.value
                        });
                      }
                    }}
                    placeholder="Enter Supplier GSTIN No."
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Spare Parts Table Input Row */}
      <Grid container spacing={1} sx={{ mt: 1, px: { xs: 1, sm: 0 } }}>
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'nowrap',
            alignItems: 'flex-end',
            gap: { xs: 1.5, sm: 1 },
            width: '100%',
            overflow: 'visible'
          }}>
            <Box sx={{ 
              width: { xs: '100%', sm: '25%' }, 
              minWidth: { sm: '180px' }
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.75rem' }, mb: 1 }}>
                Spare Name <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ height: '40px' }}>
                <PartSearch 
                  onPartSelect={handlePartSelect} 
                  value={selectedSearchPart}
                  onSearchTermChange={setSearchTerm}
                />
              </Box>
            </Box>
            
            <Box sx={{ width: { xs: '100%', sm: '15%' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.75rem' }, mb: 1 }}>
                MRP <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ height: '40px' }}>
                <SquareTextField
                  fullWidth
              size="small"
                  name="price"
                  type="number"
                  value={currentItem.price || ''}
                  onChange={handleItemChange}
                  placeholder="MRP"
                  variant="outlined"
              disabled
                  sx={{ 
                    height: '40px',
                    '& .MuiInputBase-root': {
                      height: '40px'
                    },
                    '& .MuiInputBase-input': {
                      height: '24px',
                      padding: { xs: '7px 8px', sm: '8.5px 14px' }
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '15%' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.75rem' }, mb: 1 }}>
                Rate <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ height: '40px' }}>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="rate"
              type="number"
                  value={currentItem.rate === 0 ? '' : currentItem.rate || ''}
                  onChange={handleItemChange}
                  placeholder="Rate/Item"
                  variant="outlined"
                  sx={{ 
                    height: '40px',
                    '& .MuiInputBase-root': {
                      height: '40px'
                    },
                    '& .MuiInputBase-input': {
                      height: '24px',
                      padding: { xs: '7px 8px', sm: '8.5px 14px' }
                    }
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ width: { xs: '100%', sm: '15%' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.75rem' }, mb: 1 }}>
                Qty <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ height: '40px' }}>
                <SquareTextField
                  fullWidth
              size="small"
                  name="quantity"
                  type="number"
                  value={currentItem.quantity === 0 ? '' : currentItem.quantity || ''}
                  onChange={handleItemChange}
                  inputProps={{ min: 1 }}
                  variant="outlined"
                  sx={{ 
                    height: '40px',
                    '& .MuiInputBase-root': {
                      height: '40px'
                    },
                    '& .MuiInputBase-input': {
                      height: '24px',
                      padding: { xs: '7px 8px', sm: '8.5px 14px' }
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '15%' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.75rem' }, mb: 1 }}>
                GST% <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Box sx={{ height: '40px' }}>
                <SquareTextField
                  select
                  fullWidth
                  size="small"
              name="gstPercentage"
                  value={currentItem.gstPercentage || ''}
              onChange={handleGSTChange}
                  variant="outlined"
                  sx={{ 
                    height: '40px',
                    '& .MuiInputBase-root': {
                      height: '40px'
                    },
                    '& .MuiInputBase-input': {
                      height: '24px',
                      padding: { xs: '7px 8px', sm: '8.5px 14px' }
                    }
                  }}
                >
                  {gstOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}%
                    </MenuItem>
                  ))}
                </SquareTextField>
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '15%' }, display: 'flex', alignItems: 'flex-end' }}>
              <SquareButton 
                variant="contained" 
                color="primary" 
                onClick={addItemToList}
                fullWidth
                sx={{ 
                  height: '40px',
                  mb: { xs: 1, sm: 0 }
                }}
              >
                Add
              </SquareButton>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Spare Parts Table - keep the overflowX for mobile scrolling */}
      <Box sx={{ overflowX: 'auto', px: { xs: 1, sm: 0 } }}>
        <TableContainer component={Paper} sx={{ minWidth: '100%', border: '1px solid #ddd' }}>
          <Table size="small" sx={{ minWidth: { xs: '650px', sm: '900px' } }}>
              <TableHead>
                <TableRow>
                <TableHeadCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={sparePartItems.length > 0 && selectedItems.length === sparePartItems.length}
                      indeterminate={selectedItems.length > 0 && selectedItems.length < sparePartItems.length}
                      onChange={handleSelectAll}
                      size="small"
                      sx={{ p: 0, mr: 1 }}
                    />
                    {selectedItems.length > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {selectedItems.length} selected
                      </Typography>
                    )}
                  </Box>
                </TableHeadCell>
                <TableHeadCell>Sr. No</TableHeadCell>
                <TableHeadCell>Spare No</TableHeadCell>
                <TableHeadCell>Spare Name</TableHeadCell>
                <TableHeadCell>MRP</TableHeadCell>
                <TableHeadCell>Rate</TableHeadCell>
                <TableHeadCell>Qty</TableHeadCell>
                <TableHeadCell>Taxable</TableHeadCell>
                <TableHeadCell colSpan={2} align="center">CGST</TableHeadCell>
                <TableHeadCell colSpan={2} align="center">SGST</TableHeadCell>
                <TableHeadCell>Total</TableHeadCell>
              </TableRow>
              <TableRow>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell>%</TableHeadCell>
                <TableHeadCell>Amt</TableHeadCell>
                <TableHeadCell>%</TableHeadCell>
                <TableHeadCell>Amt</TableHeadCell>
                <TableHeadCell></TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {sparePartItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableBodyCell>
                    <Checkbox
                      checked={!!item.isSelected}
                      onChange={() => handleSelectItem(item.id)}
                      size="small"
                      sx={{ p: 0 }}
                    />
                  </TableBodyCell>
                  <TableBodyCell>{index + 1}</TableBodyCell>
                  <TableBodyCell>{item.partNumber}</TableBodyCell>
                  <TableBodyCell>
                    {item.partName}
                    {item.manufacturer && (
                      <>
                        <br />
                        {item.manufacturer}
                      </>
                    )}
                  </TableBodyCell>
                  <TableBodyCell>{item.price}</TableBodyCell>
                  <TableBodyCell>
                    <SquareTextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.rate === 0 ? '' : item.rate || ''}
                      onChange={(e) => handleTableCellChange(item.id, 'rate', e.target.value)}
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'transparent' 
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#ccc' 
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'primary.main' 
                        },
                        '& .MuiInputBase-input': {
                          padding: { xs: '4px', sm: '8px 12px' },
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }
                        },
                        '& .MuiInputBase-root': {
                          height: '32px'
                        }
                      }}
                    />
                  </TableBodyCell>
                  <TableBodyCell>
                    <SquareTextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.quantity === 0 ? '' : item.quantity || ''}
                      onChange={(e) => handleTableCellChange(item.id, 'quantity', e.target.value)}
                      variant="outlined"
                      sx={{ 
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'transparent' 
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: '#ccc' 
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'primary.main' 
                        },
                        '& .MuiInputBase-input': {
                          padding: { xs: '4px', sm: '8px 12px' },
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }
                        },
                        '& .MuiInputBase-root': {
                          height: '32px'
                        }
                      }}
                    />
                  </TableBodyCell>
                  <TableBodyCell>{item.taxableAmount.toFixed(2)}</TableBodyCell>
                  <TableBodyCell>{(item.gstPercentage / 2).toFixed(1)}</TableBodyCell>
                  <TableBodyCell>{item.cgst.toFixed(2)}</TableBodyCell>
                  <TableBodyCell>{(item.gstPercentage / 2).toFixed(1)}</TableBodyCell>
                  <TableBodyCell>{item.sgst.toFixed(2)}</TableBodyCell>
                  <TableBodyCell>{item.total.toFixed(2)}</TableBodyCell>
                  </TableRow>
                ))}
              {sparePartItems.length > 0 && (
              <TableRow>
                  <TableBodyCell></TableBodyCell>
                  <TableBodyCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>Total</TableBodyCell>
                  <TableBodyCell sx={{ fontWeight: 'bold' }}>
                    {sparePartItems.reduce((sum, item) => sum + item.taxableAmount, 0).toFixed(2)}
                  </TableBodyCell>
                  <TableBodyCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                    {sparePartItems.reduce((sum, item) => sum + item.cgst, 0).toFixed(2)}
                  </TableBodyCell>
                  <TableBodyCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                    {sparePartItems.reduce((sum, item) => sum + item.sgst, 0).toFixed(2)}
                  </TableBodyCell>
                  <TableBodyCell sx={{ fontWeight: 'bold' }}>{netTotal.toFixed(2)}</TableBodyCell>
              </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Totals Section - Make it more mobile friendly */}
      <Grid container justifyContent="flex-end" spacing={1} sx={{ px: { xs: 1, sm: 0 } }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography align="right" sx={{ pr: 1, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Net Total</Typography>
            </Grid>
            <Grid item xs={6}>
              <SquareTextField
                fullWidth
                size="small"
                value={netTotal.toFixed(2)}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography align="right" sx={{ pr: 1, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Round Off</Typography>
            </Grid>
            <Grid item xs={6}>
              <SquareTextField
                fullWidth
                size="small"
                value={roundOff.toFixed(2)}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography align="right" sx={{ pr: 1, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Grand Total</Typography>
            </Grid>
            <Grid item xs={6}>
              <SquareTextField
                fullWidth
                size="small"
                value={grandTotal.toFixed(2)}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography align="right" sx={{ pr: 1, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Paid</Typography>
            </Grid>
            <Grid item xs={6}>
              <SquareTextField
                fullWidth
                size="small"
                type="number"
                value={paid}
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Action Buttons - Make them more accessible on mobile */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'center', 
        gap: { xs: 1, sm: 2 }, 
        mt: 2, 
        mb: { xs: 2, sm: 2 },
        px: { xs: 1, sm: 2 },
        width: '100%',
      }}>
        <SquareButton 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          sx={{ 
            py: { xs: 1, sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            minWidth: { xs: '100%', sm: '120px' }
          }}
        >
          {isSubmitting ? 
            `Processing ${submissionProgress.current}/${submissionProgress.total}...` : 
            "Submit"
          }
        </SquareButton>
        
        <SquareButton 
          type="button" 
          variant="contained" 
          color="info"
          onClick={() => {
            resetForm();
            setFeedback({
              message: "Form has been reset",
              severity: "info"
            });
          }}
          sx={{ 
            py: { xs: 1, sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            minWidth: { xs: '100%', sm: '120px' }
          }}
        >
          Reset
        </SquareButton>
        
        <SquareButton 
          variant="contained" 
          color="warning"
          onClick={handleRemoveSelected}
          sx={{ 
            py: { xs: 1, sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            minWidth: { xs: '100%', sm: '160px' }
          }}
        >
          Remove Selected
        </SquareButton>
      </Box>

      {/* File input for bulk import */}
      <input 
        type="file" 
        id="bulk-import-input" 
        accept=".xlsx,.xls,.csv" 
        style={{ display: 'none' }} 
        onChange={handleBulkImport} 
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {transactionToDelete === null ? "Delete Selected Items" : "Delete Transaction"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {transactionToDelete === null 
              ? `Are you sure you want to delete ${selectedItems.length} selected items?` 
              : "Are you sure you want to delete this transaction? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* New part dialog */}
      <Dialog open={isNewPartDialogOpen} onClose={() => setIsNewPartDialogOpen(false)} maxWidth="md">
        <DialogTitle>
          {newPartData.partName ? `Add New Part: ${newPartData.partName}` : 'Add New Part'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Manufacturer <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="manufacturer"
                  value={newPartData.manufacturer}
                  onChange={handleNewPartChange}
                  placeholder="Enter manufacturer"
                  required
                  autoFocus
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Part Name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="partName"
                  value={newPartData.partName}
                  onChange={handleNewPartChange}
                  placeholder="Enter part name"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Part Number <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="partNumber"
                  value={newPartData.partNumber}
                  onChange={handleNewPartChange}
                  placeholder="Enter part number"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="description"
                  value={newPartData.description}
                  onChange={handleNewPartChange}
                  placeholder="Enter description"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Selling Price (MRP) <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="price"
                  type="number"
                  value={newPartData.price === 0 ? '' : newPartData.price}
                  onChange={handleNewPartChange}
                  placeholder="Enter selling price"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Initial Quantity <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="quantity"
                  type="number"
                  value={newPartData.quantity === 0 ? '' : newPartData.quantity}
                  onChange={handleNewPartChange}
                  placeholder="Enter initial quantity"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  CGST % <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="cGST"
                  type="number"
                  value={newPartData.cGST === 0 ? '' : newPartData.cGST}
                  onChange={handleNewPartChange}
                  placeholder="Enter CGST percentage"
                  disabled
                  sx={{ bgcolor: '#f9f9f9' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  SGST % <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="sGST"
                  type="number"
                  value={newPartData.sGST === 0 ? '' : newPartData.sGST}
                  onChange={handleNewPartChange}
                  placeholder="Enter SGST percentage"
                  disabled
                  sx={{ bgcolor: '#f9f9f9' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total GST % <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  select
                  fullWidth
                  size="small"
                  name="totalGST"
                  value={newPartData.totalGST}
                  onChange={handleNewPartChange}
                  required
                >
                  {gstOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}%
                    </MenuItem>
                  ))}
                </SquareTextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Buying Price <span style={{ color: 'red' }}>*</span>
                </Typography>
                <SquareTextField
                  fullWidth
                  size="small"
                  name="buyingPrice"
                  type="number"
                  value={newPartData.buyingPrice === 0 ? '' : newPartData.buyingPrice}
                  onChange={handleNewPartChange}
                  placeholder="Enter buying price"
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setIsNewPartDialogOpen(false)} 
            color="secondary"
            variant="outlined"
            sx={{ borderRadius: 0 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleNewPartSubmit} 
            color="primary" 
            variant="contained"
            disabled={isCreatingPart || !newPartData.partName || !newPartData.partNumber || !newPartData.manufacturer}
            sx={{ borderRadius: 0 }}
          >
            {isCreatingPart ? 
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Creating...
              </Box> : 
              'Create Part'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={feedback.severity} 
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* Batch action menu */}
      <Menu
        id="batch-menu"
        anchorEl={batchAnchorEl}
        open={Boolean(batchAnchorEl)}
        onClose={handleBatchMenuClose}
      >
        {/* ... menu items ... */}
      </Menu>

      {/* Add keyboard shortcut information */}
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', width: '100%', mt: 1 }}>
        Keyboard shortcuts: Ctrl+A (Select All), Ctrl+D (Deselect All), Ctrl+I (Import), Ctrl+S (Submit), Ctrl+Delete (Remove Selected)
      </Typography>
    </Box>
  );
};

export default TransactionAdd;