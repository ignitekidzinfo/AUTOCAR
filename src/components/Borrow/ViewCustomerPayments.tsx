import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Breadcrumbs,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from 'Services/apiService';

// Updated interface to match the server-side BorrowDTO
interface BorrowDTO {
  borrowId: number;
  customerId?: number;
  customerName: string;
  remainingDate?: string;
  remainingPayment: number;
}

const ViewCustomerPayments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<BorrowDTO[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentPayment, setCurrentPayment] = useState<BorrowDTO | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchPayments();
    } else {
      setLoading(false);
      setError('Invalid customer ID. Please return to the customer list and select a valid customer.');
    }
  }, [id]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      console.log('Fetching payments for customer ID:', id);
      
      // Get all payments and find customer by ID first
      try {
        const allResponse = await apiClient.get<BorrowDTO[]>('/api/borrows/getAll');
        console.log('All payments response:', allResponse.data);
        
        if (Array.isArray(allResponse.data) && allResponse.data.length > 0) {
          // Find the first payment with matching ID to get the customer name
          const customerPayment = allResponse.data.find(
            payment => payment.customerId === Number(id) || payment.borrowId === Number(id)
          );
          
          if (customerPayment && customerPayment.customerName) {
            setCustomerName(customerPayment.customerName);
            
            // Now filter all payments by customer name to get all payment records for this customer
            const customerPayments = allResponse.data.filter(
              payment => payment.customerName === customerPayment.customerName
            );
            
            console.log('Customer payments:', customerPayments);
            setPayments(customerPayments);
            setError(null);
          } else {
            setError('Customer not found. Please check the customer ID and try again.');
          }
        } else {
          setError('No payment records found.');
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        setError('Failed to load payment data. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payment data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (payment: BorrowDTO) => {
    setCurrentPayment(payment);
    setEditAmount(payment.remainingPayment.toString());
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentPayment(null);
    setEditAmount('');
  };

  const handleEditSubmit = async () => {
    if (!currentPayment || !editAmount) return;
    
    if (isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setEditLoading(true);
    try {
      console.log(`Updating payment for borrowId ${currentPayment.borrowId} with amount ${editAmount}`);
      
      // Use the PATCH endpoint to update the payment amount
      await apiClient.patch(
        `/api/borrows/update/${currentPayment.borrowId}`, 
        null, // no request body 
        { params: { newPayment: editAmount } } // query parameter
      );
      
      // Update the local state with the new payment amount
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.borrowId === currentPayment.borrowId 
            ? { ...payment, remainingPayment: Number(editAmount) } 
            : payment
        )
      );
      
      closeEditDialog();
    } catch (error) {
      console.error('Error updating payment:', error);
      setError('Failed to update payment. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteConfirm = (payment: BorrowDTO) => {
    setCurrentPayment(payment);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCurrentPayment(null);
  };

  const handleDelete = async () => {
    if (!currentPayment) return;
    
    setDeleteLoading(true);
    try {
      // In a real app with the added delete endpoint, you would call:
      // await apiClient.delete(`/api/borrows/delete/${currentPayment.borrowId}`);
      console.log(`Deleting payment record with ID: ${currentPayment.borrowId}`);
      
      // For now, just update the UI
      setPayments(prevPayments => 
        prevPayments.filter(payment => payment.borrowId !== currentPayment.borrowId)
      );
      
      closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting payment:', error);
      setError('Failed to delete payment. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const calculateTotal = (): number => {
    return payments.reduce((total, payment) => total + payment.remainingPayment, 0);
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    // If the date is already in a readable format, return it
    if (dateString.includes('-')) {
      return dateString;
    }
    
    // Otherwise, try to parse and format it
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Link to="/admin/customer/list" style={{ textDecoration: 'none', color: 'inherit' }}>
          List Customer Details
        </Link>
        <Typography color="text.primary">Payment History</Typography>
      </Breadcrumbs>

      <Typography variant="h5" component="h1" gutterBottom>
        Payment History for {customerName}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/admin/customer/payment/add/${id}`)}
          sx={{ 
            bgcolor: '#4caf50', 
            '&:hover': { bgcolor: '#45a049' },
            mr: 2
          }}
        >
          Add New Payment
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/admin/customer/list')}
        >
          Back to Customer List
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : payments.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No payment records found for this customer. Add a payment to get started.
        </Alert>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table aria-label="customer payments table">
              <TableHead>
                <TableRow>
                  <TableCell>Sr.No</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell align="right">Payment Amount</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment, index) => (
                  <TableRow key={payment.borrowId || index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatDate(payment.remainingDate)}</TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell align="right">{payment.remainingPayment.toFixed(1)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => openEditDialog(payment)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => openDeleteConfirm(payment)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Total Remaining
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {calculateTotal().toFixed(1)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog}>
        <DialogTitle>Update Payment Amount</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: '300px' }}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Customer
              </Typography>
              <Typography variant="body1">
                {currentPayment?.customerName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Date
              </Typography>
              <Typography variant="body1">
                {formatDate(currentPayment?.remainingDate)}
              </Typography>
            </Box>
            
            <TextField
              label="Remaining Amount"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              fullWidth
              autoFocus
              margin="dense"
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={editLoading}>Cancel</Button>
          <Button 
            onClick={handleEditSubmit}
            disabled={editLoading}
            variant="contained"
            color="primary"
          >
            {editLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payment record? This action cannot be undone.
          </Typography>
          {currentPayment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDate(currentPayment.remainingDate)}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> {currentPayment.remainingPayment.toFixed(1)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} disabled={deleteLoading}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewCustomerPayments; 