import React, { useEffect, useState } from 'react';
import { Box, Typography, Snackbar, Alert, IconButton } from '@mui/material';
import { DataGrid, GridColDef, GridCellParams } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import apiClient from 'Services/apiService';

interface UserPart {
  userPartId: number;
  partNumber: string; // Note: backend returns a Long. Adjust conversion if needed.
  partName: string;
  manufacturer: string;
  quantity: number;
  price: number;
  updateAt: string; // The backend returns a LocalDate. Ensure this format suits your UI.
}

// Updated to expect an array of UserPart directly
export const getAllUserParts = async (): Promise<UserPart[]> => {
  const response = await apiClient.get<UserPart[]>('/userParts/getAll');
  return response.data;
};

const UserPartList: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const fetchUserParts = async () => {
    setLoading(true);
    try {
      const userParts = await getAllUserParts();
      // Map the fetched data to the shape expected by DataGrid
      const formattedRows = userParts.map((p: UserPart) => ({
        id: p.userPartId, // DataGrid requires a unique "id" field
        partNumber: p.partNumber,
        partName: p.partName,
        manufacturer: p.manufacturer,
        quantity: p.quantity,
        price: p.price,
        updateAt: p.updateAt,
      }));
      setRows(formattedRows);
    } catch (error: any) {
      setFeedback({
        message: error.response?.data?.message || 'Failed to fetch user parts',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserParts();
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'view',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params: GridCellParams) => (
        <IconButton
          color="primary"
          onClick={() => navigate(`/admin/user-part/view/${params.row.id}`)}
          size="small"
        >
          <VisibilityIcon fontSize="inherit" />
        </IconButton>
      ),
    },
    { field: 'id', headerName: 'Part ID', flex: 1, minWidth: 100 },
    { field: 'partNumber', headerName: 'Part Number', flex: 1, minWidth: 100 },
    { field: 'partName', headerName: 'Part Name', flex: 1, minWidth: 150 },
    { field: 'manufacturer', headerName: 'Manufacturer', flex: 1, minWidth: 150 },
    { field: 'quantity', headerName: 'Quantity', flex: 1, minWidth: 80 },
    { field: 'price', headerName: 'Price', flex: 1, minWidth: 100 },
    { field: 'updateAt', headerName: 'Updated At', flex: 1, minWidth: 120 },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom>
        User Parts Management
      </Typography>
      <Box sx={{ height: 600, width: '100%', backgroundColor: '#fff' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Box>
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
    </Box>
  );
};

export default UserPartList;
