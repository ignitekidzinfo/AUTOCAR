import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Alert,
  AlertTitle,
  Grid,
  useMediaQuery,
  Stack,
} from '@mui/material';
import apiClient from 'Services/apiService';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export interface VehicleRegDto {
  vehicleRegId: number;
  appointmentId?: number;
  vehicleNumber: string;
  vehicleBrand?: string;
  vehicleModelName?: string;
  vehicleVariant?: string;
  engineNumber?: string;
  chasisNumber?: string;
  numberPlateColour?: string;
  kmsDriven?: number;
  email?: string;
  ManufactureYear?: number;
  advancePayment?: number;
  customerId?: number;
  customerName: string;
  customerAddress?: string;
  customerMobileNumber: string;
  customerAadharNo?: string;
  customerGstin?: string;
  superwiser?: string;
  technician?: string;
  worker?: string;
  status?: string;
  userId?: number;
  date?: string;
  vehicleInspection?: string;
  jobCard?: string;
  insuranceStatus?: string;
  insuredFrom?: string;
  insuredTo?: string;
}

const InsuranceList: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [expiredInsurances, setExpiredInsurances] = useState<VehicleRegDto[]>([]);
  const [activeInsurances, setActiveInsurances] = useState<VehicleRegDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch data from both API endpoints using the custom API service
  const fetchInsuranceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expiredResponse, activeResponse] = await Promise.all([
        apiClient.get<VehicleRegDto[]>('/vehicle-reg/expired'),
        apiClient.get<VehicleRegDto[]>('/vehicle-reg/active'),
      ]);
      setExpiredInsurances(expiredResponse.data);
      setActiveInsurances(activeResponse.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load insurance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsuranceData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterData = (data: VehicleRegDto[]) => {
    if (!searchTerm) return data;
    return data.filter((item) => {
      const searchableString = (
        item.vehicleNumber + ' ' +
        item.vehicleModelName + ' ' +
        item.customerName + ' ' +
        item.customerMobileNumber + ' ' +
        (item.insuredTo ? new Date(item.insuredTo).toLocaleDateString('en-GB') : '')
      ).toLowerCase();
      return searchableString.includes(searchTerm);
    });
  };

  const renderMobileCard = (item: VehicleRegDto) => {
    // Calculate if insurance is going to expire soon (within next 30 days)
    const expiryDate = item.insuredTo ? new Date(item.insuredTo) : null;
    const today = new Date();
    const daysUntilExpiry = expiryDate 
      ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
      : null;
    const expiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    
    return (
      <Paper
        key={item.vehicleRegId}
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderLeft: tabValue === 0 
            ? `4px solid ${theme.palette.error.main}` 
            : expiringSoon 
              ? `4px solid ${theme.palette.warning.main}`
              : `4px solid ${theme.palette.success.main}`
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <DirectionsCarIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">Vehicle</Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">
              {item.vehicleNumber}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <EventIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">Insurance</Typography>
            </Box>
            {tabValue === 0 ? (
              <Chip 
                icon={<WarningAmberIcon />}
                label="Expired" 
                size="small" 
                color="error"
                variant="outlined"
                sx={{ height: 24 }}
              />
            ) : expiringSoon ? (
              <Chip 
                icon={<AutorenewIcon />}
                label={item.insuredTo 
                  ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                  : 'N/A'
                } 
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 24 }}
              />
            ) : (
              <Chip 
                icon={<VerifiedUserIcon />}
                label={item.insuredTo 
                  ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                  : 'N/A'
                } 
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 24 }}
              />
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <PersonIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">Customer</Typography>
            </Box>
            <Typography variant="body2">{item.customerName}</Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <PhoneIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">Contact</Typography>
            </Box>
            <Typography variant="body2">{item.customerMobileNumber}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Vehicle Model</Typography>
              <Typography variant="body2">
                {item.vehicleModelName || 'N/A'} {item.vehicleBrand ? `(${item.vehicleBrand})` : ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderTable = (data: VehicleRegDto[]) => {
    const filteredData = filterData(data);

    if (filteredData.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 4,
          minHeight: 200,
          color: 'text.secondary'
        }}>
          <ErrorOutlineIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
          <Typography variant="h6">No records found</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'No insurance records available in this category'}
          </Typography>
        </Box>
      );
    }

    // For mobile devices, render cards instead of table
    if (isMobile) {
      return (
        <Box sx={{ mt: 2 }}>
          {filteredData.map(item => renderMobileCard(item))}
        </Box>
      );
    }

    return (
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          marginTop: 2, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'auto',   // Enable horizontal scrolling on smaller screens
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        <Table sx={{ minWidth: isTablet ? 650 : 800 }}>
          <TableHead sx={{ 
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsCarIcon fontSize="small" color="primary" />
                  Vehicle Number
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Vehicle Model</TableCell>
              <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="primary" />
                  Customer
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="primary" />
                  Mobile
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon fontSize="small" color="primary" />
                  Insured Until
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item) => {
              // Calculate if insurance is going to expire soon (within next 30 days)
              const expiryDate = item.insuredTo ? new Date(item.insuredTo) : null;
              const today = new Date();
              const daysUntilExpiry = expiryDate 
                ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
                : null;
              const expiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
              
              return (
                <TableRow 
                  key={item.vehicleRegId}
                  sx={{
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.03) },
                    borderLeft: tabValue === 0 
                      ? `4px solid ${theme.palette.error.main}` 
                      : expiringSoon 
                        ? `4px solid ${theme.palette.warning.main}`
                        : `4px solid ${theme.palette.success.main}`
                  }}
                >
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {item.vehicleNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.vehicleModelName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.vehicleBrand || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: isTablet ? '120px' : '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={item.customerName}>
                      <Typography variant="body2" noWrap>{item.customerName}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">{item.customerMobileNumber}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {tabValue === 0 ? (
                      <Chip 
                        icon={<WarningAmberIcon />}
                        label="Expired" 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    ) : expiringSoon ? (
                      <Tooltip title={`Expires in ${daysUntilExpiry} days`}>
                        <Chip 
                          icon={<AutorenewIcon />}
                          label={item.insuredTo 
                            ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                            : 'N/A'
                          } 
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : (
                      <Chip 
                        icon={<VerifiedUserIcon />}
                        label={item.insuredTo 
                          ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                          : 'N/A'
                        } 
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSummary = () => {
    const data = tabValue === 0 ? expiredInsurances : activeInsurances;
    const filteredData = filterData(data);
    
    if (loading) return null;
    
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">Total Vehicles</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
                {filteredData.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                {searchTerm ? 'Matching your search' : 'In this category'}
              </Typography>
            </Paper>
          </Grid>
          
          {tabValue === 1 && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">Expiring Soon</Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ mt: 1 }}>
                    {filteredData.filter(item => {
                      const expiryDate = item.insuredTo ? new Date(item.insuredTo) : null;
                      const today = new Date();
                      const daysUntilExpiry = expiryDate 
                        ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) 
                        : null;
                      return daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                    }).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                    Expires within 30 days
                  </Typography>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            fontWeight="bold" 
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <VerifiedUserIcon color="primary" /> Insurance Vehicle Lists
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage vehicle insurance records
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 0 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            indicatorColor="primary" 
            textColor="primary"
            sx={{ 
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                py: { xs: 1, sm: 2 },
                minHeight: { xs: 48, sm: 'auto' }
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorOutlineIcon fontSize="small" />
                  <span>{isMobile ? "Expired" : "Expired Insurance"}</span>
                  {!loading && expiredInsurances.length > 0 && (
                    <Chip 
                      label={expiredInsurances.length} 
                      size="small" 
                      color="error" 
                      sx={{ ml: 0.5, minWidth: 30, height: 20 }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VerifiedUserIcon fontSize="small" />
                  <span>{isMobile ? "Active" : "Active Insurance"}</span>
                  {!loading && activeInsurances.length > 0 && (
                    <Chip 
                      label={activeInsurances.length} 
                      size="small" 
                      color="success" 
                      sx={{ ml: 0.5, minWidth: 30, height: 20 }}
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>
          
          <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Search Box */}
            <TextField 
              label={isMobile ? "Search" : "Search Insurance Records"}
              variant="outlined"
              fullWidth
              size="small"
              onChange={handleSearchChange}
              placeholder={isMobile ? "Vehicle, Customer, etc..." : "Search by vehicle number, model, customer name, phone..."}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />

            {renderSummary()}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
                <CircularProgress size={40} />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Loading insurance data...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert 
                severity="error" 
                sx={{ mt: 2, borderRadius: 2 }}
                action={
                  <Tooltip title="Retry">
                    <AutorenewIcon 
                      fontSize="small" 
                      sx={{ cursor: 'pointer' }} 
                      onClick={fetchInsuranceData}
                    />
                  </Tooltip>
                }
              >
                <AlertTitle>Error Loading Data</AlertTitle>
                {error}
              </Alert>
            )}

            {!loading && !error && (
              <>
                {tabValue === 0 && (
                  <Box role="tabpanel">
                    {renderTable(expiredInsurances)}
                  </Box>
                )}
                {tabValue === 1 && (
                  <Box role="tabpanel">
                    {renderTable(activeInsurances)}
                  </Box>
                )}
              </>
            )}
            
            {/* Mobile scroll indicator */}
            {!isMobile && isTablet && filterData(tabValue === 0 ? expiredInsurances : activeInsurances).length > 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                mt: 1, 
                opacity: 0.6 
              }}>
                <Typography variant="caption">
                  ← Swipe horizontally to view all columns →
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InsuranceList;
