import * as React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
  Tooltip,
  Paper,
  Chip,
  alpha,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GridCellParams, GridColDef } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import InputAdornment from '@mui/material/InputAdornment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import VehicleDeleteModal from './VehicleDeleteModal';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Print, FilterListOutlined, Add as AddIcon } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useVehicleData, markVehicleDataChanged } from 'hooks/useVehicleData';
import {
  DEBOUNCE_DELAY,
  DEFAULT_PAGE_SIZES,
  ERROR_DISPLAY_DURATION,
  SEARCH_TYPES,
  STATUS_CONFIG,
  DELETE_SUCCESS_DURATION,
} from 'constants/vehicle.constants';
import { VehicleListFilters, SearchType } from 'types/vehicle.types';

export default function VehicleList() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const listType = searchParams.get('listType');
  const theme = useTheme();

  // Use custom hook for vehicle data management with auto-refresh
  const {
    vehicles,
    loading,
    initialLoad,
    error: dataError,
    pagination,
    refresh,
    loadMore,
    markVehicleDeleted,
  } = useVehicleData({
    listType,
    autoRefresh: true, // Enable auto-refresh for real-time updates
  });

  // UI state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);

  // Advanced search state
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Debounce timer
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Local client-side filtering of vehicles
  const filteredVehicles = useMemo(() => {
    const searchTerm = localSearchTerm.toLowerCase();
    if (!searchTerm) return vehicles;

    return vehicles.filter(
      (row) =>
        row.vehicleNoName?.toLowerCase().includes(searchTerm) ||
        row.customerMobile?.toLowerCase().includes(searchTerm) ||
        row.status?.toLowerCase().includes(searchTerm) ||
        row.superwiser?.toLowerCase().includes(searchTerm) ||
        row.technician?.toLowerCase().includes(searchTerm) ||
        row.worker?.toLowerCase().includes(searchTerm) ||
        row.kilometer?.toString().includes(searchTerm) ||
        row.advance?.toString().includes(searchTerm)
    );
  }, [vehicles, localSearchTerm]);

  // Debounced local search handler
  const handleLocalSearch = useCallback((term: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setLocalSearchTerm(term.toLowerCase());
    }, DEBOUNCE_DELAY);
  }, []);

  // Delete handler
  const handleDeleteClick = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setDeleteModalOpen(true);
    setIsDeleting(false);
    setDeleteError(null);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (vehicleId: number) => {
      setIsDeleting(true);
      setDeleteError(null);

      try {
        // Optimistically update UI
        markVehicleDeleted(String(vehicleId));

        // Close modal and show success
        setDeleteModalOpen(false);
        setSuccessMessage('Vehicle deleted successfully');

        // Clear success message after delay
        setTimeout(() => {
          setSuccessMessage(null);
        }, DELETE_SUCCESS_DURATION);

        // **IMPORTANT**: Immediately refresh to get latest data from server
        // This ensures the deletion is confirmed and any other changes are picked up
        setTimeout(() => {
          refresh();
        }, 500);
      } catch (error: any) {
        console.error('Delete error:', error);
        setDeleteError(error.message || 'Failed to delete vehicle');
        // Refresh to restore correct state
        refresh();
      } finally {
        setIsDeleting(false);
      }
    },
    [markVehicleDeleted, refresh]
  );

  // Navigation handlers that mark data as changed
  const handleAddVehicle = useCallback(() => {
    markVehicleDataChanged();
    navigate('/admin/vehicle/add');
  }, [navigate]);

  const handleEditVehicle = useCallback(
    (id: string) => {
      markVehicleDataChanged();
      navigate(`/admin/vehicle/edit/${id}`);
    },
    [navigate]
  );

  const handleAddServiceParts = useCallback(
    (id: string) => {
      markVehicleDataChanged();
      navigate(`/admin/vehicle/add/servicepart/${id}`);
    },
    [navigate]
  );

  const handleViewVehicle = useCallback(
    (id: string) => {
      navigate(`/admin/vehicle/view/${id}`);
    },
    [navigate]
  );

  // Render action buttons
  const renderActionButtons = useCallback(
    (params: GridCellParams) => {
      const vehicleId = params.row.vehicleRegId;

      const handleClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        action();
      };

      return (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 0.7,
            width: '100%',
            maxWidth: '80px',
          }}
        >
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              size="small"
              onClick={(e) => handleClick(e, () => handleEditVehicle(vehicleId))}
              sx={{
                p: 0.5,
                minWidth: '28px',
                minHeight: '28px',
                maxWidth: '28px',
                maxHeight: '28px',
                background: '#e3f2fd',
                border: '1px solid #bbdefb',
                '&:hover': { background: '#bbdefb' },
              }}
            >
              <EditIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Service Parts">
            <IconButton
              color="primary"
              size="small"
              onClick={(e) => handleClick(e, () => handleAddServiceParts(vehicleId))}
              sx={{
                p: 0.5,
                minWidth: '28px',
                minHeight: '28px',
                maxWidth: '28px',
                maxHeight: '28px',
                background: '#e3f2fd',
                border: '1px solid #bbdefb',
                '&:hover': { background: '#bbdefb' },
              }}
            >
              <BuildIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="View/Print">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => handleClick(e, () => handleViewVehicle(vehicleId))}
              sx={{
                p: 0.5,
                minWidth: '28px',
                minHeight: '28px',
                maxWidth: '28px',
                maxHeight: '28px',
                background: '#212121',
                color: 'white',
                '&:hover': { background: '#424242' },
              }}
            >
              <Print sx={{ fontSize: '16px' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleClick(e, () => handleDeleteClick(vehicleId))}
              disabled={isDeleting && selectedVehicleId === vehicleId}
              sx={{
                p: 0.5,
                minWidth: '28px',
                minHeight: '28px',
                maxWidth: '28px',
                maxHeight: '28px',
                background: '#f44336',
                color: 'white',
                '&:hover': { background: '#d32f2f' },
                '&.Mui-disabled': {
                  background: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              {isDeleting && selectedVehicleId === vehicleId ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [
      handleEditVehicle,
      handleAddServiceParts,
      handleViewVehicle,
      handleDeleteClick,
      isDeleting,
      selectedVehicleId,
    ]
  );

  // Render status badge
  const renderStatus = useCallback((params: GridCellParams) => {
    const status = params.value as string;
    const statusLower = status?.toLowerCase() || '';

    let config: { bgcolor: string; textColor: string } = STATUS_CONFIG.default;
    let Icon: typeof CheckCircleIcon | null = null;
    let pulseAnimation = false;

    if (statusLower.includes('complete')) {
      config = { ...STATUS_CONFIG.complete };
      Icon = CheckCircleIcon;
    } else if (statusLower.includes('progress')) {
      config = { ...STATUS_CONFIG.progress };
      Icon = BuildIcon;
      pulseAnimation = true;
    } else if (statusLower.includes('waiting')) {
      config = { ...STATUS_CONFIG.waiting };
      Icon = AccessTimeIcon;
    }

    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderRadius: '16px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: config.bgcolor,
          color: config.textColor,
        }}
      >
        {pulseAnimation && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: config.textColor,
              mr: 0.5,
              animation: 'pulse 1.5s infinite ease-in-out',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
        )}
        {Icon && !pulseAnimation && <Icon sx={{ fontSize: '0.875rem', mr: 0.5 }} />}
        {status}
      </Box>
    );
  }, []);

  // Render invoice status
  const renderInvoiceStatus = useCallback((params: GridCellParams) => {
    const hasInvoice = params.row.hasInvoice;

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {hasInvoice ? (
          <CheckCircleIcon color="success" sx={{ fontSize: '1.25rem' }} />
        ) : (
          <CancelIcon color="error" sx={{ fontSize: '1.25rem' }} />
        )}
      </Box>
    );
  }, []);

  // Column definitions
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'Action',
        headerName: 'Actions',
        width: 85,
        minWidth: 85,
        renderCell: renderActionButtons,
        sortable: false,
        filterable: false,
        headerAlign: 'center',
        cellClassName: 'wrap-cell-content',
        disableColumnMenu: true,
        flex: 0,
      },
      {
        field: 'date',
        headerName: 'Date',
        width: 100,
        minWidth: 90,
        maxWidth: 120,
        flex: 0.5,
        cellClassName: 'wrap-cell-content',
      },
      {
        field: 'vehicleNoName',
        headerName: 'Vehicle Number',
        width: 140,
        minWidth: 120,
        flex: 1,
        cellClassName: 'wrap-cell-content',
        renderCell: (params) => {
          const parts = params.value?.toString().split('-');
          return (
            <Box sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Typography sx={{ fontWeight: 500 }}>{parts?.[0] || params.value}</Typography>
              {parts?.[1] && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {parts.slice(1).join('-')}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'customerMobile',
        headerName: 'Customer & Mobile',
        width: 160,
        minWidth: 130,
        flex: 1.2,
        cellClassName: 'wrap-cell-content',
        renderCell: (params) => {
          const [name, mobile] = params.value?.toString().split('-').map((s: string) => s.trim()) || [];
          return (
            <Box sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Typography sx={{ fontWeight: 500 }}>{name}</Typography>
              {mobile && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {mobile}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        minWidth: 100,
        flex: 0.7,
        cellClassName: 'wrap-cell-content',
        renderCell: renderStatus,
      },
      {
        field: 'advance',
        headerName: 'Advance',
        width: 100,
        minWidth: 80,
        flex: 0.6,
        cellClassName: 'wrap-cell-content',
        renderCell: (params) => <Box>₹{params.row.advance}</Box>,
      },
      {
        field: 'kilometer',
        headerName: 'Kilometer',
        width: 110,
        minWidth: 80,
        flex: 0.6,
        cellClassName: 'wrap-cell-content',
      },
      {
        field: 'hasInvoice',
        headerName: 'Invoice',
        width: 80,
        minWidth: 70,
        flex: 0.4,
        cellClassName: 'wrap-cell-content',
        renderCell: renderInvoiceStatus,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'superwiser',
        headerName: 'Supervisor',
        width: 120,
        minWidth: 100,
        flex: 0.8,
        cellClassName: 'wrap-cell-content',
      },
      {
        field: 'technician',
        headerName: 'Technician',
        width: 120,
        minWidth: 100,
        flex: 0.8,
        cellClassName: 'wrap-cell-content',
      },
      {
        field: 'worker',
        headerName: 'Worker',
        width: 120,
        minWidth: 100,
        flex: 0.8,
        cellClassName: 'wrap-cell-content',
      },
    ],
    [renderActionButtons, renderStatus, renderInvoiceStatus]
  );

  // Skeleton loading component
  const SkeletonLoading = useCallback(
    () => (
      <Box sx={{ p: 2 }}>
        {[...Array(3)].map((_, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              mb: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: 'center',
              borderRadius: 2,
              background: theme.palette.background.paper,
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', sm: '15%' },
                height: 24,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
              }}
            />
            <Box
              sx={{
                width: { xs: '100%', sm: '25%' },
                height: 24,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
              }}
            />
            <Box
              sx={{
                width: { xs: '100%', sm: '20%' },
                height: 24,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1,
              }}
            />
            <Box sx={{ width: { xs: '100%', sm: '40%' }, height: 24, display: 'flex', gap: 1 }}>
              {[...Array(4)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    height: 24,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                  }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    ),
    [theme]
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' }, p: 2 }}>
      <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
                Vehicle List
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {(successMessage || dataError) && (
                <Alert
                  severity={successMessage ? 'success' : 'error'}
                  sx={{
                    flexGrow: 1,
                    animation: 'fadeIn 0.3s',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  {successMessage || dataError}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddVehicle}
              >
                Add Vehicle
              </Button>
            </Stack>
          </Stack>

          {/* Quick Search */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <OutlinedInput
              size="small"
              placeholder="Quick search in results..."
              onChange={(e) => handleLocalSearch(e.target.value)}
              startAdornment={
                <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              }
              sx={{
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.common.white, 0.05),
              }}
            />
          </FormControl>

          {/* Data Grid */}
          <Box
            sx={{
              position: 'relative',
              height: 'auto',
              width: '100%',
              overflow: 'visible',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {initialLoad ? (
              <SkeletonLoading />
            ) : (
              <Box sx={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <CustomizedDataGrid
                  columns={columns}
                  rows={filteredVehicles}
                  autoHeight={true}
                  density="standard"
                  checkboxSelection={false}
                  disableRowSelectionOnClick
                  getRowHeight={() => 'auto'}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 20 } },
                  }}
                  pageSizeOptions={DEFAULT_PAGE_SIZES}
                  disableColumnMenu
                  columnVisibilityModel={{
                    superwiser: window.innerWidth > 1200,
                    technician: window.innerWidth > 1100,
                    worker: window.innerWidth > 1000,
                  }}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    border: 'none',
                    borderRadius: 1,
                    overflow: 'visible',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                      padding: '8px 16px',
                      fontSize: '0.875rem',
                      whiteSpace: 'normal !important',
                      wordWrap: 'break-word',
                      lineHeight: '1.43',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      '&.wrap-cell-content': {
                        whiteSpace: 'normal',
                        lineHeight: '1.2em',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                      },
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      minHeight: '36px !important',
                      maxHeight: 'none !important',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      padding: '8px 16px',
                      backgroundColor: '#fafafa',
                      borderBottom: '1px solid #e0e0e0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                    },
                  }}
                />

                {loading && !initialLoad && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CircularProgress size={24} thickness={5} sx={{ mr: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Refreshing vehicles...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Stats */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 2,
              p: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {loading && !initialLoad
                ? `Refreshing ${pagination.totalElements} vehicles...`
                : `Showing ${filteredVehicles.length} of ${pagination.totalElements} vehicles`}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <VehicleDeleteModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteError(null);
          setIsDeleting(false);
        }}
        deleteItemId={selectedVehicleId ? Number(selectedVehicleId) : undefined}
        onDeleteSuccess={handleDeleteConfirm}
        isDeleting={isDeleting}
        error={deleteError}
      />

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}