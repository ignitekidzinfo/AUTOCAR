import React, { useEffect, useState, FC, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  useTheme,
  alpha,
  Divider,
  useMediaQuery,
  Avatar,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Container,
  Grid,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useNotification } from '../../components/common/Notification';
import { useSidebar } from '../../contexts/SidebarContext';

interface EmployeeDTO {
  id: number | null;
  name: string | null;
  position: string;
  contact: string;
  address: string;
  email: string | null;
  username: string | null;
  userId: number | null;
  password: string | null;
  role: string | null;
  componentNames: string[];
}

const EmployeeList: FC = () => {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen } = useSidebar();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use effect to force re-render when sidebar state changes
  useEffect(() => {
    // Trigger a resize event to make the DataGrid recalculate its width
    window.dispatchEvent(new Event('resize'));
  }, [sidebarOpen]);

  const fetchEmployees = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      console.log('Fetching employees data...');
      const response = await apiClient.get<EmployeeDTO[]>('/api/employees/getAll');
      console.log('Employees data received:', response.data.length);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification({
        message: 'Failed to fetch employees',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch employees on initial load
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Re-fetch when location changes (navigating back from edit page)
  useEffect(() => {
    if (location.pathname === '/admin/employeelist') {
      console.log('Back at employee list, refreshing data');
      fetchEmployees(false); // Don't show loading state when coming back to the page
    }
  }, [location]);

  // Add event listener for visibility change to refresh data when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing employee data');
        fetchEmployees();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleEdit = (employeeId: number | null) => {
    if (employeeId) {
      navigate(`/admin/employeeManagement/edit/${employeeId}`);
    } else {
      showNotification({
        message: 'Invalid employee ID',
        type: 'error',
      });
    }
  };

  const handleDeleteClick = (employeeId: number | null) => {
    if (employeeId) {
      setEmployeeToDelete(employeeId);
      setDeleteConfirmOpen(true);
    } else {
      showNotification({
        message: 'Invalid employee ID',
        type: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    try {
      setDeleteInProgress(true);
      
      // Optimistic update - remove from UI immediately
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete));
      
      // Then send the delete request
      await apiClient.delete(`/api/employees/delete/${employeeToDelete}`);
      
        showNotification({
          message: 'Employee deleted successfully',
          type: 'success',
        });
      
      // No need to call fetchEmployees here since we've already updated the state
      } catch (error) {
        console.error('Error deleting employee:', error);
        showNotification({
          message: 'Failed to delete employee',
          type: 'error',
        });
      
      // Revert the optimistic update if the API call fails
      fetchEmployees(false);
    } finally {
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      setDeleteInProgress(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  const handleAddNew = () => {
    navigate('/admin/employeeManagement');
  };

  const handleRefresh = () => {
    fetchEmployees(false);
  };

  const handleFilterChange = (event: React.SyntheticEvent, newValue: string) => {
    setFilterPosition(newValue);
  };

  const filteredEmployees = employees.filter((employee: EmployeeDTO) => {
    // First apply position filter
    if (filterPosition !== 'all' && employee.position.toLowerCase() !== filterPosition.toLowerCase()) {
      return false;
    }
    
    // Then apply search filter
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fields = [
      employee.name,
      employee.position,
      employee.contact,
      employee.email,
      employee.address,
      employee.username,
    ];
    
    return fields.some(field => 
      field && field.toString().toLowerCase().includes(searchLower)
    );
  });

  // Get position counts for badges
  const positionCounts = employees.reduce((acc, employee) => {
    const position = employee.position.toLowerCase();
    if (!acc[position]) acc[position] = 0;
    acc[position]++;
    return acc;
  }, {} as {[key: string]: number});

  // Add serial number to employees
  const employeesWithIndex = filteredEmployees.map((employee, index) => ({
    ...employee,
    srNo: index + 1
  }));

  // Custom header renderer to handle mobile view with line breaks
  const renderHeaderWithTooltip = (params: any) => {
    const headerName = params.colDef.headerName || '';
    
    // For mobile view, add break for multi-word headers
    if (isMobile && headerName.includes(' ')) {
      const words = headerName.split(' ');
      
      return (
        <Tooltip title={headerName}>
          <Box sx={{ lineHeight: 1.1, textAlign: 'center' }}>
            {words.map((word: string, index: number) => (
              <React.Fragment key={index}>
                {word}
                {index < words.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Box>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip title={headerName}>
        <span>{headerName}</span>
      </Tooltip>
    );
  };

  // Define all columns with flexible widths
  const columns: GridColDef[] = [
    { 
      field: 'srNo', 
      headerName: 'Sr No', 
      width: 60,
      minWidth: 50,
      maxWidth: 60,
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      flex: 0,
      renderHeader: renderHeaderWithTooltip,
    },
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 100,
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
    },
    { 
      field: 'position', 
      headerName: 'Position', 
      width: 90,
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
      renderCell: (params) => {
        let color = 'default';
        switch(params.value.toLowerCase()) {
          case 'manager':
            color = 'primary';
            break;
          case 'supervisor':
            color = 'success';
            break;
          case 'technician':
            color = 'info';
            break;
          case 'worker':
            color = 'secondary';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Chip 
            label={params.value} 
            size="small"
            sx={{ 
              fontSize: { xs: '0.6rem', sm: '0.75rem' }, 
              height: { xs: '20px', sm: '24px' },
              fontWeight: 'medium',
            }}
            color={color as any}
          />
        );
      },
    },
    { 
      field: 'contact', 
      headerName: 'Contact', 
      width: 90,
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 140,
      minWidth: 100,
      flex: 0.8,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              width: '100%',
              fontSize: { xs: '0.7rem', sm: '0.875rem' }
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    { 
      field: 'username', 
      headerName: 'Username', 
      width: 90,
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
    },
    { 
      field: 'password', 
      headerName: 'Password', 
      width: 90,
      minWidth: 80,
      flex: 0.5,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LockIcon sx={{ fontSize: '0.8rem', opacity: 0.7, mr: 0.5 }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            {params.value || 'No password'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 90,
      minWidth: 80,
      flex: 0,
      sortable: false,
      renderHeader: renderHeaderWithTooltip,
      renderCell: (params: GridRenderCellParams<EmployeeDTO>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => handleEdit(params.row.id)}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                padding: { xs: '2px', sm: '4px' }
              }}
            >
              <EditIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} color="primary" />
          </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={() => handleDeleteClick(params.row.id)}
              sx={{ 
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                padding: { xs: '2px', sm: '4px' }
              }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }} color="error" />
          </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Card view for mobile screens
  const renderEmployeeCard = (employee: EmployeeDTO & { srNo: number }) => {
    return (
      <Card 
        key={employee.id || employee.srNo} 
        elevation={1}
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }
        }}
      >
        <Box sx={{ display: 'flex', p: 2, bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              color: 'white',
              width: 40,
              height: 40
            }}
          >
            {(employee.name?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {employee.name || 'Unnamed'}
            </Typography>
            <Chip 
              label={employee.position} 
              size="small"
              sx={{ 
                fontSize: '0.7rem', 
                height: '20px',
                fontWeight: 'medium',
                mt: 0.5
              }}
              color={
                employee.position.toLowerCase() === 'manager' ? 'primary' : 
                employee.position.toLowerCase() === 'supervisor' ? 'success' : 
                employee.position.toLowerCase() === 'technician' ? 'info' : 
                employee.position.toLowerCase() === 'worker' ? 'secondary' : 'default'
              }
            />
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: '0.9rem' }} />
                <Typography variant="body2">{employee.contact || 'No contact'}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: '0.9rem' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {employee.email || 'No email'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountCircleIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: '0.9rem' }} />
                <Typography variant="body2">{employee.username || 'No username'}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LockIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: '0.9rem' }} />
                <Typography variant="body2">{employee.password || 'No password'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Divider />
        
        <Box sx={{ display: 'flex', p: 1, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button 
            startIcon={<EditIcon />}
            onClick={() => handleEdit(employee.id)}
            sx={{ 
              flex: 1, 
              mr: 1,
              fontSize: '0.75rem',
              py: 0.5
            }}
            color="primary"
            variant="outlined"
            size="small"
          >
            Edit
          </Button>
          <Button 
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteClick(employee.id)}
            sx={{ 
              flex: 1,
              fontSize: '0.75rem',
              py: 0.5
            }}
            color="error"
            variant="outlined"
            size="small"
          >
            Delete
          </Button>
        </Box>
      </Card>
    );
  };

  // Polling mechanism to keep data fresh
  useEffect(() => {
    // Set up polling every 30 seconds to refresh data
    const pollInterval = setInterval(() => {
      console.log('Polling for employee data updates');
      fetchEmployees(false); // Don't show loading indicator during polling
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <Container maxWidth={false} disableGutters>
      <Box
        position="relative"
        mx="auto"
        display="flex"
        flexDirection="column"
        width="100%"
        sx={{
          transition: "width 0.3s ease-in-out, max-width 0.3s ease-in-out, margin 0.3s ease-in-out",
          height: "100%",
          p: { xs: 1, sm: 2 }
        }}
        ref={containerRef}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
            borderRadius: "12px",
            height: "100%",
            backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
          }}
        >
          <CardContent
            sx={{
              width: "100%",
              maxWidth: "100%",
              padding: { xs: "16px", sm: "24px" },
              paddingBottom: "16px !important",
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                marginBottom: "16px",
                width: "100%",
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon 
                  sx={{ 
                    color: theme.palette.primary.main, 
                    mr: 1.5, 
                    fontSize: { xs: '1.5rem', sm: '2rem' } 
                  }} 
                />
                <Typography
                  variant="h5"
                  sx={{ 
                    fontWeight: "600", 
                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                    color: theme.palette.text.primary,
                    textAlign: { xs: "center", sm: "left" }
                  }}
                >
                  Employee Management
                </Typography>
              </Box>

              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                spacing={1}
                width={{ xs: "100%", sm: "auto" }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh">
                    <IconButton 
                      size="small" 
                      onClick={handleRefresh} 
                      disabled={refreshing}
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                      }}
                    >
                      {refreshing ? 
                        <CircularProgress size={18} color="inherit" /> : 
                        <RefreshIcon fontSize="small" />
                      }
                    </IconButton>
                  </Tooltip>
            <TextField
              size="small"
                    placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: { xs: "100%", sm: "200px" },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
                  sx={{
                    borderRadius: "8px",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    whiteSpace: "nowrap",
                    width: { xs: "100%", sm: "auto" },
                    py: 1,
                  }}
                >
                  Add New Employee
            </Button>
              </Stack>
            </Stack>

            <Box sx={{ mb: 2, overflow: 'auto', display: { xs: 'flex', sm: 'block' } }}>
              <Tabs
                value={filterPosition}
                onChange={handleFilterChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="employee position filter tabs"
                sx={{ 
                  minHeight: '42px',
                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                  '& .MuiTab-root': { minHeight: '42px', py: 0 }
                }}
              >
                <Tab 
                  label="All"
                  value="all"
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: filterPosition === 'all' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                />
                <Tab 
                  label="Manager" 
                  value="manager"
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: filterPosition === 'manager' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                />
                <Tab 
                  label="Supervisor"
                  value="supervisor"
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: filterPosition === 'supervisor' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                />
                <Tab 
                  label="Technician"
                  value="technician"
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: filterPosition === 'technician' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                />
                <Tab 
                  label="Worker"
                  value="worker"
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: filterPosition === 'worker' ? 'bold' : 'normal',
                    fontSize: '0.875rem'
                  }}
                />
              </Tabs>
        </Box>

            {/* For tablets and desktop: Table view */}
            {!isMobile && (
              <Box
                sx={{
                  width: "100%",
                  position: "relative",
                  overflowX: "auto",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '8px',
                  },
                }}
              >
                <DataGrid
                  rows={employeesWithIndex}
                  columns={columns}
                  getRowId={(row) => row.id || Math.random()} // Fallback for missing IDs
          autoHeight
                  hideFooter={employeesWithIndex.length <= 25}
          loading={loading}
                  disableColumnMenu
                  disableRowSelectionOnClick
          sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      padding: { xs: '0 4px', sm: '0 8px' }
                    },
                    '& .MuiDataGrid-root': {
                      border: "none",
                      minWidth: { xs: "600px", md: "100%" },
                      maxWidth: "none",
                    },
            '& .MuiDataGrid-cell': {
                      borderBottom: "none",
                      padding: { xs: '10px 8px', sm: '16px' },
                      display: 'flex',
                      alignItems: 'center'
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      borderRadius: "8px",
                      borderBottom: "none",
            },
            '& .MuiDataGrid-virtualScroller': {
                      marginTop: "10px !important",
            },
            '& .MuiDataGrid-footerContainer': {
                      borderTop: "none",
                    },
                    '& .MuiDataGrid-virtualScrollerRenderZone': {
                      '& .MuiDataGrid-row': {
                        '&:nth-of-type(2n)': {
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      },
                    },
                    '& .MuiDataGrid-columnHeader': {
                      padding: { xs: '0 4px', sm: '0 16px' }
                    },
                    width: "100%",
                    flex: 1,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                  slots={{
                    noRowsOverlay: () => (
                      <Stack
                        height="100%"
                        alignItems="center"
                        justifyContent="center"
                        padding="40px"
                      >
                        <Typography color="text.secondary">
                          {loading ? "Loading employees..." : "No employees found"}
                        </Typography>
                      </Stack>
                    ),
                  }}
                />

                {/* Mobile scroll indicator for tablets */}
                {isTablet && !isMobile && (
                  <Box
                    sx={{
                      display: { xs: "block", md: "none" },
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)",
                      borderRadius: "0 0 8px 8px",
                      width: "100%",
                    }}
                  />
                )}

                {/* Mobile scroll helper text for tablets */}
                {isTablet && !isMobile && (
                  <Box
                    sx={{
                      display: { xs: "flex", md: "none" },
                      justifyContent: "center",
                      alignItems: "center",
                      mt: 1,
                      color: "text.secondary",
                      fontSize: "0.75rem"
                    }}
                  >
                    <Typography variant="caption">← Swipe to see more →</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* For mobile: Card view */}
            {isMobile && (
              <Box sx={{ mt: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : employeesWithIndex.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No employees found</Typography>
                  </Box>
                ) : (
                  employeesWithIndex.map(renderEmployeeCard)
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            Confirm Delete
    </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this employee? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={handleDeleteCancel} 
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleteInProgress ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeeList; 