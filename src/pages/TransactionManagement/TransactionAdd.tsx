import * as React from 'react';
import { useState, useEffect, FormEvent, useMemo } from "react";
import apiClient from "Services/apiService";
import storageUtils from '../../utils/storageUtils';
import PartSearch from '../../components/common/PartSearch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BatchIcon from '@mui/icons-material/DynamicFeed';
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
import DeleteIcon from '@mui/icons-material/Delete';

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
  gstin?: string;
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
  rate?: number;  // Make rate optional
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
    rate: undefined, // Changed from 0 to undefined
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

  const memoizedVendorSuggestions = useMemo(() => vendorSuggestions, [vendorSuggestions]);

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

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Calculate values if price, quantity or GST changes
    if (name === 'price' || name === 'quantity' || name === 'gstPercentage' || name === 'rate') {
      const price = name === 'price' ? parseFloat(value) : (currentItem.price || 0);
      const quantity = name === 'quantity' ? parseFloat(value) || 1 : (currentItem.quantity || 1); // Use || 1 to ensure valid number
      const gstPercentage = name === 'gstPercentage' ? parseFloat(value) : (currentItem.gstPercentage || 0);
      const rate = name === 'rate' ? parseFloat(value) : (currentItem.rate);
      
      // Only calculate if rate has a value
      if (rate !== undefined && rate !== null) {
        const taxableAmount = rate * quantity;
        const gstAmount = (taxableAmount * gstPercentage) / 100;
        const cgst = gstPercentage > 0 ? gstAmount / 2 : 0;
        const sgst = gstPercentage > 0 ? gstAmount / 2 : 0;
        const total = taxableAmount + gstAmount;
        
        console.log("Updated calculations:", {
          price, quantity, rate, gstPercentage, taxableAmount, cgst, sgst, total
        });
        
        setCurrentItem(prev => ({
          ...prev,
          price,
          quantity,
          rate,
          gstPercentage,
          taxableAmount,
          cgst,
          sgst,
          total
        }));
      } else {
        // If rate is not set, clear calculated values
        setCurrentItem(prev => ({
          ...prev,
          price,
          quantity,
          gstPercentage,
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
    
    // First clear the selectedSearchPart state
    setSelectedSearchPart(null);
    
    // Then reset current item state
    setCurrentItem({
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
    
    // Force clear the search input field using DOM manipulation
    setTimeout(() => {
      const searchInputs = document.querySelectorAll('input[aria-autocomplete="list"]');
      searchInputs.forEach(input => {
        const htmlInput = input as HTMLInputElement;
        htmlInput.value = '';
      });
    }, 10);
    
    // Update totals
    calculateTotals([...sparePartItems, newItem]);
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
      
    try {
      // Check if there are any existing transactions that might need updating
      const existingTransactions = sparePartItems.filter(item => item.transactionId);
      
      if (existingTransactions.length > 0) {
        // Ask user if they want to update existing transactions
        const shouldUpdate = window.confirm(
          `You have ${existingTransactions.length} existing transactions. Do you want to update them?`
        );
        
        if (shouldUpdate) {
          await bulkUpdateTransactions(existingTransactions);
        }
      }
      
      // Process new transactions
      const newItems = sparePartItems.filter(item => !item.transactionId);
      
      if (newItems.length > 0) {
        // Create array to store promises for each new transaction
        const createPromises = newItems.map(item => {
          // Prepare the data to submit to the API
          const transactionData = {
            transactionType: "CREDIT" as const,
            userId: 10006, // Using the default value from initialCreateData
            vendorId: selectedVendor.vendorId,
            partNumber: item.partNumber,
            partName: item.partName,
            manufacturer: item.manufacturer || "",
            quantity: item.quantity.toString(),
            price: item.rate,
            // Use invoiceNo as billNo
            billNo: createData.invoiceNo,
            name: selectedVendor.name,
            gstPercentage: item.gstPercentage,
            taxableAmount: item.taxableAmount,
            cgst: item.cgst,
            sgst: item.sgst,
            igst: 0, // Default to 0 as we're using CGST/SGST
            totalAmount: item.total,
            description: "",
            // Don't send invoiceNo and invoiceDate as they're not expected by the API
          };

          console.log("Creating transaction:", transactionData);
          
          // Return the API call promise
          return apiClient.post("/sparePartTransactions/add", transactionData);
        });
        
        // Execute all create operations
        const results = await Promise.allSettled(createPromises);
        
        const succeeded = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;
        
        if (failed > 0) {
          setFeedback({
            message: `${succeeded} transactions created successfully, ${failed} failed`,
            severity: "warning"
          });
        } else {
          setFeedback({
            message: "All transactions created successfully",
            severity: "success"
          });
          
          // Reset form only if all transactions were successfully created
          setCreateData(initialCreateData);
          setSelectedVendor(null);
          setSparePartItems([]);
          setNetTotal(0);
          setRoundOff(0);
          setGrandTotal(0);
          setPaid(0);
        }
      } else {
        setFeedback({
          message: "No new transactions to create",
          severity: "info"
        });
      }
    } catch (error: any) {
      console.error("Error processing transactions:", error);
      setFeedback({
        message: error.response?.data?.message || "Failed to process transactions",
        severity: "error"
      });
    }
  };

  const handleCloseSnackbar = () => {
    setFeedback(null);
  };

  const handleManagePurchase = () => {
    navigate('admin/manage-purchaseaccountreport');
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

  const handleTableCellChange = (id: number, field: keyof SparePartItem, value: string | number) => {
    setSparePartItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === id) {
          // Convert value to number if it's a string
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          
          // Create updated item with the new field value
          const updatedItem = { ...item, [field]: numValue };
          
          // Recalculate values if rate or quantity changes
          if (field === 'rate' || field === 'quantity') {
            const rate = field === 'rate' ? numValue : item.rate;
            const quantity = field === 'quantity' ? numValue : item.quantity;
            
            // Only calculate if rate is defined
            if (rate !== undefined) {
              // Calculate taxable amount (rate * quantity)
              const taxableAmount = rate * quantity;
              
              // Calculate GST amounts
              const gstAmount = (taxableAmount * item.gstPercentage) / 100;
              const cgst = item.gstPercentage > 0 ? gstAmount / 2 : 0;
              const sgst = item.gstPercentage > 0 ? gstAmount / 2 : 0;
              
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
              // If rate is undefined, set calculated values to 0
              return {
                ...updatedItem,
                taxableAmount: 0,
                cgst: 0,
                sgst: 0,
                total: 0
              };
            }
          }
          
          return updatedItem;
        }
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
        
        // Call the API to delete the transaction
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

  // Function to handle bulk updates of transactions
  const bulkUpdateTransactions = async (items: SparePartItem[]) => {
    const updatePromises = items
      .filter(item => item.transactionId) // Only include items with valid transaction IDs
      .map(item => {
        const transactionDto: SparePartTransactionDto = {
          transactionId: item.transactionId,
          transactionType: "CREDIT", // Assuming this is a purchase transaction
          partNumber: item.partNumber,
          partName: item.partName,
          manufacturer: item.manufacturer || "",
          quantity: item.quantity,
          price: item.rate !== undefined ? item.rate : 0, // Using rate as the price
          sparePartId: item.sparePartId,
          qtyPrice: item.taxableAmount,
        };
        
        return apiClient.put(
          `/sparePartTransactions/update?transactionId=${item.transactionId}`,
          transactionDto
        );
      });
    
    try {
      const results = await Promise.allSettled(updatePromises);
      
      const fulfilled = results.filter(result => result.status === 'fulfilled').length;
      const rejected = results.filter(result => result.status === 'rejected').length;
      
      if (rejected > 0) {
        setFeedback({
          message: `${fulfilled} transactions updated successfully, ${rejected} failed`,
          severity: "warning"
        });
      } else {
        setFeedback({
          message: `All ${fulfilled} transactions updated successfully`,
          severity: "success"
        });
      }
    } catch (error: any) {
      console.error("Error during bulk update:", error);
      setFeedback({
        message: "Failed to update some transactions",
        severity: "error"
      });
    }
  };
  
  // Function to handle bulk delete of transactions
  const bulkDeleteTransactions = async (transactionIds: number[]) => {
    if (transactionIds.length === 0) return;
    
    // Create an array of promises for delete operations
    const deletePromises = transactionIds.map(id => 
      apiClient.delete(`/sparePartTransactions/delete?transactionId=${id}`)
    );
    
    try {
      console.log("Bulk deleting transaction IDs:", transactionIds);
      
      // Execute all delete operations
      const results = await Promise.allSettled(deletePromises);
      
      const fulfilled = results.filter(result => result.status === 'fulfilled').length;
      const rejected = results.filter(result => result.status === 'rejected').length;
      
      // Update the UI by removing deleted items
      const deletedIds = new Set(transactionIds.filter((id, index) => 
        results[index].status === 'fulfilled'
      ));
      
      setSparePartItems(prev => 
        prev.filter(item => !item.transactionId || !deletedIds.has(item.transactionId))
      );
      
      // Recalculate totals after removing items
      const updatedItems = sparePartItems.filter(item => 
        !item.transactionId || !deletedIds.has(item.transactionId)
      );
      calculateTotals(updatedItems);
      
      if (rejected > 0) {
        setFeedback({
          message: `${fulfilled} transactions deleted successfully, ${rejected} failed`,
          severity: "warning"
        });
      } else {
        setFeedback({
          message: `All ${fulfilled} transactions deleted successfully`,
          severity: "success"
        });
      }
    } catch (error: any) {
      console.error("Error during bulk delete:", error);
      setFeedback({
        message: "Failed to delete some transactions",
        severity: "error"
      });
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
    
    try {
      // Prepare form data for API call
      const formData = new FormData();
      formData.append("partName", newPartData.partName);
      formData.append("description", newPartData.description || "");
      formData.append("manufacturer", newPartData.manufacturer);
      formData.append("price", newPartData.price.toString());
      formData.append("partNumber", newPartData.partNumber);
      formData.append("sGST", newPartData.sGST.toString());
      formData.append("cGST", newPartData.cGST.toString());
      formData.append("totalGST", newPartData.totalGST.toString());
      formData.append("quantity", newPartData.quantity.toString());
      formData.append("buyingPrice", newPartData.buyingPrice.toString());
      
      // Add empty photo since the API requires it
      const emptyBlob = new Blob([""], { type: "application/octet-stream" });
      formData.append("photos", new File([emptyBlob], "placeholder.jpg"));
      
      console.log("Creating new part:", newPartData);
      
      // Call the API to create the part
      const response = await apiClient.post("/sparePartManagement/addPart", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Part created successfully:", response.data);
      
      // Create the new part object and select it
      const createdPart: SparePartDto = {
        partName: newPartData.partName,
        partNumber: newPartData.partNumber,
        manufacturer: newPartData.manufacturer,
        description: newPartData.description,
        buyingPrice: newPartData.buyingPrice,
        price: newPartData.price,
        sparePartId: response.data.sparePartId || Date.now() // Fallback if API doesn't return ID
      };
      
      // Select the newly created part
      handlePartSelect(createdPart);
      
      // Set the GST percentage from the new part data
      setCurrentItem(prev => ({
        ...prev,
        gstPercentage: newPartData.totalGST
      }));
      
      setFeedback({
        message: "New spare part created successfully",
        severity: "success"
      });
      
      // Close the dialog
      setIsNewPartDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating new part:", error);
      setFeedback({
        message: error.response?.data?.message || "Failed to create new part",
        severity: "error"
      });
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
                    getOptionLabel={(option: Vendor) => option.name}
                    onChange={handleSelectVendor}
                    value={selectedVendor}
                    isOptionEqualToValue={(option: Vendor, value: Vendor) => option.vendorId === value.vendorId}
                    renderInput={(params) => <TextField {...params} placeholder="Select / Enter Supplier Name" />}
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
                    value={selectedVendor?.mobile || ""}
                    placeholder="Enter Supplier Mobile No."
                    disabled={!selectedVendor}
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
                    value={selectedVendor?.gstin || ""}
                    placeholder="Enter Supplier GSTIN No."
                    disabled={!selectedVendor}
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
                  value={currentItem.rate || ''}
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
                  value={currentItem.quantity || ''}
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
                  <TableBodyCell>{item.partName}</TableBodyCell>
                  <TableBodyCell>{item.price}</TableBodyCell>
                  <TableBodyCell>
                    <SquareTextField
                      fullWidth
                      size="small"
                      type="number"
                      value={item.rate}
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
                      value={item.quantity}
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
          sx={{ 
            py: { xs: 1, sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            minWidth: { xs: '100%', sm: '120px' }
          }}
        >
          Submit
        </SquareButton>
        
        <SquareButton 
          type="reset" 
          variant="contained" 
          color="info"
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

      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ 
          bottom: { xs: 16, sm: 24 },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          maxWidth: '90vw'
        }}
      >
        {feedback ? (
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={feedback.severity} 
            sx={{ 
              width: '100%', 
              borderRadius: 0,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '& .MuiAlert-message': {
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {transactionToDelete ? 
              "Are you sure you want to delete this transaction? This action cannot be undone." :
              `Are you sure you want to delete ${
                sparePartItems.filter(item => item.isSelected && item.transactionId).length
              } selected transactions? This action cannot be undone.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <SquareButton onClick={handleCancelDelete} color="primary">
            Cancel
          </SquareButton>
          <SquareButton onClick={confirmDelete} color="error">
            Delete
          </SquareButton>
        </DialogActions>
      </Dialog>

      {/* Add the Dialog component for creating new parts */}
      <Dialog 
        open={isNewPartDialogOpen}
        onClose={() => setIsNewPartDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            p: { xs: 1, sm: 2 },
            borderRadius: 1,
            margin: { xs: '8px', sm: '32px' },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 16px)', sm: 'auto' },
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 0, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: 'primary.main' }}>
          Add New Spare Part
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Part Name"
                name="partName"
                value={newPartData.partName}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                autoFocus
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Part Number"
                name="partNumber"
                value={newPartData.partNumber}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Manufacturer"
                name="manufacturer"
                value={newPartData.manufacturer}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Description"
                name="description"
                value={newPartData.description}
                onChange={handleNewPartChange}
                fullWidth
                multiline
                rows={2}
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Selling Price"
                name="price"
                type="number"
                value={newPartData.price}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                InputProps={{ inputProps: { min: 0 } }}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Buying Price"
                name="buyingPrice"
                type="number"
                value={newPartData.buyingPrice}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                InputProps={{ inputProps: { min: 0 } }}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                select
                label="GST %"
                name="totalGST"
                value={newPartData.totalGST}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                size="small"
              >
                {gstOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}%
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                label="SGST"
                name="sGST"
                type="number"
                value={newPartData.sGST}
                onChange={handleNewPartChange}
                fullWidth
                disabled
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <TextField
                label="CGST"
                name="cGST"
                type="number"
                value={newPartData.cGST}
                onChange={handleNewPartChange}
                fullWidth
                disabled
                margin="dense"
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={12}>
              <TextField
                label="Quantity"
                name="quantity"
                type="number"
                value={newPartData.quantity}
                onChange={handleNewPartChange}
                fullWidth
                required
                margin="dense"
                InputProps={{ inputProps: { min: 1 } }}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button 
            onClick={() => setIsNewPartDialogOpen(false)} 
            color="inherit" 
            variant="outlined" 
            size="medium"
            fullWidth={window.innerWidth < 600}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleNewPartSubmit} 
            color="primary" 
            variant="contained"
            disabled={isCreatingPart}
            size="medium"
            sx={{ ml: { xs: 0, sm: 2 } }}
            fullWidth={window.innerWidth < 600}
          >
            {isCreatingPart ? <CircularProgress size={24} /> : "Create Part"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add keyboard shortcut information */}
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', width: '100%', mt: 1 }}>
        Keyboard shortcuts: Ctrl+A (Select All), Ctrl+D (Deselect All), Ctrl+I (Import), Ctrl+S (Submit), Ctrl+Delete (Remove Selected)
      </Typography>
    </Box>
  );
};

export default TransactionAdd;