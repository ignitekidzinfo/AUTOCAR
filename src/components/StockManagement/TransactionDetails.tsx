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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from 'Services/apiService';
import {
  Inventory,
  Category,
  PrecisionManufacturing,
  AttachMoney,
  CalendarToday,
  Numbers,
  InfoOutlined,
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

export default function UserPartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [userPart, setUserPart] = useState<UserPart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [showOverlay, setShowOverlay] = useState<boolean>(false);

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
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          minHeight: '100vh',
          backgroundColor: '#121212',
        }}
      >
        <CircularProgress sx={{ color: '#fff' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: '#121212',
        minHeight: '100vh',
        color: '#fff',
        py: 4,
        position: 'relative', 
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            User Part Details
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
              Back
            </Button>
          
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteDialog}
            >
              Delete
            </Button>
          </Box>
        </Stack>

        {userPart ? (
          <Grid container spacing={3}>
         
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <Inventory />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Part ID:
                </Typography>
                <Typography>{userPart.userPartId}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <Numbers />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Spare Part ID:
                </Typography>
                <Typography>{userPart.sparePartId}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <InfoOutlined />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Part Number:
                </Typography>
                <Typography>{userPart.partNumber}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <Category />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Part Name:
                </Typography>
                <Typography>{userPart.partName}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Description:
                </Typography>
                <Typography>{userPart.description}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <PrecisionManufacturing />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Manufacturer:
                </Typography>
                <Typography>{userPart.manufacturer}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <Inventory />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Quantity:
                </Typography>
                <Typography>{userPart.quantity}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <AttachMoney />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Price:
                </Typography>
                <Typography>₹{userPart.price}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <AttachMoney />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Buying Price:
                </Typography>
                <Typography>₹{userPart.buyingPrice}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <InfoOutlined />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  CGST:
                </Typography>
                <Typography>{userPart.cGST}%</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <InfoOutlined />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  SGST:
                </Typography>
                <Typography>{userPart.sGST}%</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <InfoOutlined />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total GST:
                </Typography>
                <Typography>{userPart.totalGST}%</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <CalendarToday />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Last Updated:
                </Typography>
                <Typography>{new Date(userPart.updateAt).toLocaleDateString()}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#1e1e1e', p: 2, borderRadius: 2 }}>
                <CalendarToday />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Last Update Info:
                </Typography>
                <Typography>{userPart.lastUpdate}</Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="h6" color="error" align="center">
            No details available
          </Typography>
        )}

        <Dialog open={openDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Spare Part</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this spare part? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
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
            <Alert onClose={() => setFeedback(null)} severity={feedback.severity} sx={{ width: '100%' }}>
              {feedback.message}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Container>

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
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Spare part deleted successfully.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
