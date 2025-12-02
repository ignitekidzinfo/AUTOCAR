import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Tooltip,
  useTheme,
  alpha,
  Alert,
  AlertTitle,
  Grid,
  useMediaQuery,
  Skeleton,
  Button,
} from '@mui/material';
import apiClient from 'Services/apiService';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { VehicleRegDto } from '../types/vehicle.types';
import InsuranceCard from './insurance/InsuranceCard';
import InsuranceTable from './insurance/InsuranceTable';

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
  const fetchInsuranceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expiredResponse, activeResponse] = await Promise.all([
        apiClient.get<VehicleRegDto[]>('/vehicle-reg/expired'),
        apiClient.get<VehicleRegDto[]>('/vehicle-reg/active'),
      ]);

      // Helper to deduplicate
      const deduplicate = (data: VehicleRegDto[]) => {
        const byVehicleNumber: Record<string, VehicleRegDto> = {};
        data.forEach(item => {
          if (byVehicleNumber[item.vehicleNumber]) {
            const existingItem = byVehicleNumber[item.vehicleNumber];
            const existingDate = existingItem.insuredTo ? new Date(existingItem.insuredTo) : new Date(0);
            const newDate = item.insuredTo ? new Date(item.insuredTo) : new Date(0);

            if (newDate > existingDate) {
              byVehicleNumber[item.vehicleNumber] = item;
            }
          } else {
            byVehicleNumber[item.vehicleNumber] = item;
          }
        });
        return Object.values(byVehicleNumber);
      };

      setExpiredInsurances(deduplicate(expiredResponse.data));
      setActiveInsurances(deduplicate(activeResponse.data));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load insurance data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsuranceData();
  }, [fetchInsuranceData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredData = useMemo(() => {
    const data = tabValue === 0 ? expiredInsurances : activeInsurances;
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
  }, [tabValue, expiredInsurances, activeInsurances, searchTerm]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
          ))}
        </Box>
      );
    }

    if (error) {
      return (
        <Alert
          severity="error"
          sx={{ mt: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchInsuranceData}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Data</AlertTitle>
          {error}
        </Alert>
      );
    }

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

    if (isMobile) {
      return (
        <Box sx={{ mt: 2 }}>
          {filteredData.map(item => (
            <InsuranceCard
              key={item.vehicleRegId}
              item={item}
              isExpired={tabValue === 0}
            />
          ))}
        </Box>
      );
    }

    return <InsuranceTable data={filteredData} isExpired={tabValue === 0} />;
  };

  const renderSummary = () => {
    if (loading) return <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2, mt: 2, mb: 3 }} />;
    if (error) return null;

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
            {renderContent()}

            {!isMobile && isTablet && !loading && !error && filteredData.length > 0 && (
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
