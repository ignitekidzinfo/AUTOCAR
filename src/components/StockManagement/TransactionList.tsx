import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridCellParams,
  GridColumnHeaderParams,
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useNavigate } from 'react-router-dom';
import apiClient from 'Services/apiService';

interface UserPart {
  userPartId: number;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: number;
  price: number;
  updateAt: string;
  description: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

const pageSize = 30;

async function getAllUserParts(page: number): Promise<PaginatedResponse<UserPart>> {
  const response = await apiClient.get<PaginatedResponse<UserPart>>('/userParts/getAll', {
    params: { page, size: pageSize },
  });
  return response.data;
}

const UserPartList: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);

  useEffect(() => {
    fetchUserParts(0);
  }, []);

  const fetchUserParts = async (page: number) => {
    setLoading(true);
    try {
      const paginatedResponse = await getAllUserParts(page);
      setTotalPages(paginatedResponse.totalPages);
      setTotalElements(paginatedResponse.totalElements);
      setCurrentPage(paginatedResponse.currentPage);

      const formattedRows = paginatedResponse.content.map((p) => ({
        id: p.userPartId,
        partNumber: p.partNumber,
        partName: p.partName,
        description: p.description,
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

  const renderHeaderWithTooltip = (params: GridColumnHeaderParams) => (
    <Tooltip title={params.colDef.headerName || ''}>
      <span>{params.colDef.headerName}</span>
    </Tooltip>
  );

  const columns: GridColDef[] = [
    {
      field: 'view',
      headerName: '',
      flex: 0.3,
      minWidth: 50,
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
      renderHeader: () => null,
    },
    {
      field: 'id',
      headerName: 'Part ID',
      flex: 0.7,
      minWidth: 80,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'partNumber',
      headerName: 'Part Number',
      flex: 1,
      minWidth: 120,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'partName',
      headerName: 'Part Name',
      flex: 1,
      minWidth: 150,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 150,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'manufacturer',
      headerName: 'Manufacturer',
      flex: 1,
      minWidth: 150,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      flex: 0.7,
      minWidth: 80,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.7,
      minWidth: 100,
      renderHeader: renderHeaderWithTooltip,
    },
    {
      field: 'updateAt',
      headerName: 'Updated At',
      flex: 1,
      minWidth: 120,
      renderHeader: renderHeaderWithTooltip,
    },
  ];

  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      fetchUserParts(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      fetchUserParts(currentPage + 1);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#121212',
      }}
    >
      
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ color: '#fff', pt: 2 }}
      >
        User Parts Management
      </Typography>

      <Box
        sx={{
          flex: 1,
          backgroundColor: '#fff',
          m: 2,
          borderRadius: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          hideFooterPagination
          hideFooter
          disableColumnMenu
          sx={{
            flex: 1,
            border: 'none',

            '& .MuiDataGrid-columnHeaders': {
              whiteSpace: 'nowrap',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
            },
          
            '& .MuiDataGrid-columnSeparator': {
              opacity: 1,
              visibility: 'visible',
            },
      
            '& .MuiDataGrid-menuIconButton': {
              display: 'none',
            },
           
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
              padding: '0 !important',
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          p: 2,
        }}
      >
        <Typography variant="body1">
          {`${startIndex}–${endIndex} of ${totalElements}`}
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIosIcon />}
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            sx={{ mr: 2 }}
          >
            Prev
          </Button>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIosIcon />}
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1 || totalPages === 0}
          >
            Next
          </Button>
        </Box>
      </Box>

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
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default UserPartList;
