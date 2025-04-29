import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Snackbar,
  Alert,
  Stack,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Divider,
  Chip,
  Paper,
  useTheme,
  alpha,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from 'Services/apiService';
import {
  Inventory,
  Category,
  PrecisionManufacturing,
  CalendarToday,
  Numbers,
  InfoOutlined,
  Edit as EditIcon,
  ArrowBack,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CurrencyRupee as RupeeIcon,
  Description,
  BusinessCenter as SupplierIcon,
} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';

interface UserPart {
  userPartId: number;
  quantity: number;
  lastUpdate: string;
  sparePartId: number;
  partName: string;
  description: string;
  manufacturer: string;
  price: number;
  updateAt: string;
  partNumber: string;
  cGST: number;
  sGST: number;
  totalGST: number;
  buyingPrice: number;
}

interface UpdateUserPartRequestDTO {
  userPartId: number;
  partName: string;
  manufacturer: string;
  price: number;
  updateAt: string; 
  partNumber: string;
  quantity: number;
  cGST: number;
  sGST: number;
  totalGST: number;
  buyingPrice: number;
}

export default function UserPartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [userPart, setUserPart] = useState<UserPart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UpdateUserPartRequestDTO>({
    userPartId: 0,
    partName: '',
    manufacturer: '',
    price: 0,
    updateAt: '',
    partNumber: '',
    quantity: 0,
    cGST: 0,
    sGST: 0,
    totalGST: 0,
    buyingPrice: 0,
  });

  useEffect(() => {
    const fetchUserPart = async () => {
      try {
        const response = await apiClient.get<UserPart>(`/userParts/getById?userPartId=${id}`);
        setUserPart(response.data);
      } catch (error: any) {
        setFeedback({
          message: error.response?.data?.message || 'Failed to fetch user part details',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPart();
  }, [id]);

  const handleEditClick = () => {
    if (userPart) {
      setFormData({
        userPartId: userPart.userPartId,
        partName: userPart.partName,
        manufacturer: userPart.manufacturer,
        price: userPart.price,
        updateAt: new Date(userPart.updateAt).toISOString().split('T')[0],
        partNumber: userPart.partNumber,
        quantity: userPart.quantity,
        cGST: userPart.cGST,
        sGST: userPart.sGST,
        totalGST: userPart.totalGST,
        buyingPrice: userPart.buyingPrice,
      });
    }
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'price' ||
        name === 'quantity' ||
        name === 'cGST' ||
        name === 'sGST' ||
        name === 'totalGST' ||
        name === 'buyingPrice'
          ? Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    try {
      const updatedFormData = { ...formData, updateAt: new Date().toISOString().split('T')[0] };

      const response = await apiClient.patch<UpdateUserPartRequestDTO>('/userParts/update', updatedFormData);

      if (userPart) {
        const updatedUserPart: UserPart = {
          ...userPart,
          ...response.data,
          lastUpdate: `Updated on ${new Date().toLocaleString()}`,
        };
        setUserPart(updatedUserPart);
      }
      setFeedback({ message: 'Spare part updated successfully.', severity: 'success' });
      setEditMode(false);
    } catch (error: any) {
      setFeedback({
        message: error.response?.data?.message || 'Update failed',
        severity: 'error',
      });
    }
  };

  const handleOpenDeleteDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (!userPart) return;
    setOpenDialog(false);

    try {
      await apiClient.delete(`/sparePartManagement/delete/${userPart.sparePartId}`);
      setFeedback({ message: 'Spare part deleted successfully.', severity: 'success' });
      setShowOverlay(true);

      setTimeout(() => {
        navigate('/admin/transaction-list');
      }, 2000);
    } catch (error: any) {
      setFeedback({
        message: error.response?.data?.message || 'Failed to delete the spare part',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading part details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: alpha(theme.palette.background.default, 0.8),
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        p: 3,
      }}
    >
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3, boxShadow: theme.shadows[3] }}>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{ 
                  bgcolor: theme.palette.primary.main,
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 }
                }}
              >
                <Inventory fontSize="large" />
              </Avatar>
              <Box>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' } }}
                >
                  {userPart?.partName || 'Part Details'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Part ID: {userPart?.userPartId} • Part Number: {userPart?.partNumber}
                </Typography>
              </Box>
            </Stack>
            
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1.5, 
                mt: { xs: 2, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' } 
              }}
            >
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/admin/transaction-list')}
                startIcon={<ArrowBack />}
                size={isMobile ? "small" : "medium"}
                sx={{ borderRadius: 2 }}
              >
                Back
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<SupplierIcon />}
                onClick={() => userPart?.manufacturer && window.open(`/admin/supplier/search/${userPart.manufacturer}`, '_blank')}
                size={isMobile ? "small" : "medium"}
                sx={{ borderRadius: 2 }}
              >
                View Supplier
              </Button>
              
              {editMode ? (
                <>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    size={isMobile ? "small" : "medium"}
                    sx={{ borderRadius: 2 }}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    size={isMobile ? "small" : "medium"}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<EditIcon />} 
                    onClick={handleEditClick}
                    size={isMobile ? "small" : "medium"}
                    sx={{ borderRadius: 2 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    onClick={handleOpenDeleteDialog}
                    size={isMobile ? "small" : "medium"}
                    sx={{ borderRadius: 2 }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ 
          p: { xs: 2, sm: 3 } 
        }}>
          {userPart ? (
            <>
              {/* Status Info */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                mb: 3,
                justifyContent: { xs: 'center', sm: 'flex-start' } 
              }}>
                <Chip 
                  icon={<Inventory />}
                  label={`Quantity: ${userPart.quantity}`}
                  color={userPart.quantity < 5 ? "warning" : "success"}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip 
                  icon={<RupeeIcon />}
                  label={`Selling Price: ₹${userPart.price}`}
                  color="primary"
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip 
                  icon={<CalendarToday />}
                  label={`Updated: ${new Date(userPart.updateAt).toLocaleDateString()}`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>

              {editMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6} lg={8}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 2, 
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        sx={{ 
                          mb: 2, 
                          pb: 1, 
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Inventory color="primary" fontSize="small" /> Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Part ID"
                            name="userPartId"
                            value={formData.userPartId}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Spare Part ID"
                            value={userPart.sparePartId}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Part Number"
                            name="partNumber"
                            value={formData.partNumber}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Part Name"
                            name="partName"
                            value={formData.partName}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Manufacturer"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 2, 
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        sx={{ 
                          mb: 2, 
                          pb: 1, 
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <RupeeIcon color="primary" fontSize="small" /> Pricing & Inventory
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Selling Price (₹)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                            InputProps={{
                              startAdornment: <RupeeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Purchase Rate (₹)"
                            name="buyingPrice"
                            type="number"
                            value={formData.buyingPrice}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                            InputProps={{
                              startAdornment: <RupeeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            disabled
                            label="Last Updated Date"
                            name="updateAt"
                            type="date"
                            value={new Date().toISOString().split('T')[0]}
                            variant="outlined"
                            size="small"
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        sx={{ 
                          mb: 2, 
                          pb: 1, 
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <InfoOutlined color="primary" fontSize="small" /> Tax Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="CGST (%)"
                            name="cGST"
                            type="number"
                            value={formData.cGST}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="SGST (%)"
                            name="sGST"
                            type="number"
                            value={formData.sGST}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Total GST (%)"
                            name="totalGST"
                            type="number"
                            value={formData.totalGST}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6} lg={8}>
                    <Paper 
                      elevation={0} 
                      sx={{
                        p: 3, 
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category fontSize="small" /> Basic Information
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Part ID</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.userPartId}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Spare Part ID</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.sparePartId}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Part Number</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.partNumber}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Part Name</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.partName}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.manufacturer}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper 
                      elevation={0} 
                      sx={{
                        p: 3, 
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.03),
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: theme.palette.info.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PrecisionManufacturing fontSize="small" /> Inventory & Pricing
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Quantity</Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium"
                            color={userPart.quantity < 5 ? "warning.main" : "text.primary"}
                          >
                            {userPart.quantity} units
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Selling Price</Typography>
                          <Typography variant="body1" fontWeight="medium">₹{userPart.price}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Purchase Rate</Typography>
                          <Typography variant="body1" fontWeight="medium">₹{userPart.buyingPrice}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                          <Typography variant="body1" fontWeight="medium">{new Date(userPart.updateAt).toLocaleDateString()}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary">Last Update Info</Typography>
                          <Typography variant="body1" fontWeight="medium">{userPart.lastUpdate}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{
                        p: 3, 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.03),
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: theme.palette.success.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoOutlined fontSize="small" /> Tax Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">CGST</Typography>
                            <Typography variant="body1" fontWeight="medium">{userPart.cGST}%</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">SGST</Typography>
                            <Typography variant="body1" fontWeight="medium">{userPart.sGST}%</Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Total GST</Typography>
                            <Typography variant="body1" fontWeight="medium">{userPart.totalGST}%</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{
                        p: 3, 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.grey[500], 0.03),
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description fontSize="small" /> Description
                      </Typography>
                      
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {userPart.description || "No description available."}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="error" align="center">
                No details available
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate(-1)}
                sx={{ mt: 2 }}
              >
                Go Back
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" /> Delete Spare Part
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <DialogContentText>
            Are you sure you want to delete this spare part? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert 
            onClose={() => setFeedback(null)} 
            severity={feedback.severity} 
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      {showOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          <Paper elevation={4} sx={{ p: 4, borderRadius: 2, maxWidth: '400px', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Spare part deleted successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to parts list...
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </Paper>
        </Box>
      )}
    </Box>
  );
}
