import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from 'Services/apiService';
import {
  Box,
  Paper,
  Grid,
  Typography,
  styled,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputBase,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { Task, Description, NoteAdd } from '@mui/icons-material';
import { useNotification } from '../common/Notification';

// HeaderCard styled component for navigation
const HeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  cursor: "pointer",
  borderRadius: theme.shape.borderRadius,
  transition: "transform 0.3s, box-shadow 0.3s",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: 120, // Fixed height for consistency
  width: '100%', // Use full width of the grid item
  boxShadow: theme.shadows[2],
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[4],
  },
}));

// Search input and results styling
const SearchInputWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
  width: '100%',
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 2),
    transition: theme.transitions.create('width'),
  },
}));

const SearchResultsContainer = styled(Paper)(({ theme }) => ({
  position: "absolute",
  width: "100%",
  zIndex: 10,
  maxHeight: 300,
  overflowY: "auto",
  marginTop: theme.spacing(0.5),
  boxShadow: theme.shadows[4],
}));

const SearchResultItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  cursor: "pointer",
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

// Table related styles
const StyledTable = styled(Box)(({ theme }) => ({
  width: '100%',
  overflowX: 'auto',
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
  },
  '& th, & td': {
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 'bold',
  },
  '& tr:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '& tr:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  [theme.breakpoints.down('sm')]: {
    '& th, & td': {
      padding: theme.spacing(0.75, 1),
      fontSize: '0.875rem',
    },
  },
}));

interface Service {
  serviceId: number;
  serviceName: string;
  serviceRate: number | null;
  totalGst: number;
}

interface InvoiceService extends Service {
  quantity: number;
  taxable: number;
  total: number | null;
  vehicleServicesUsedId?: number;
  newService?: boolean;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ServiceTab = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [services, setServices] = useState<InvoiceService[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Function to render header cards
  const renderHeaderCards = () => {
    const headerCards = [
      {
        label: "Job Card",
        icon: <Task fontSize="large" color="primary" />,
        value: "jobCard",
        onClick: () => navigate(`/admin/job-card/${vehicleId}`),
      },
      {
        label: "Spare",
        icon: <Description fontSize="large" color="primary" />,
        value: "spare",
        onClick: () => navigate(`/admin/add-vehicle-part-service/${vehicleId}`),
      },
      {
        label: "Service",
        icon: <NoteAdd fontSize="large" color="primary" />,
        value: "service",
        onClick: () => {}, // already on service tab
      },
    ];

    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '900px', mx: 'auto' }}>
          {headerCards.map((card) => (
            <Grid item xs={12} sm={4} md={4} key={card.value}>
              <HeaderCard 
                onClick={card.onClick}
                sx={{
                  border: card.value === 'service' ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  backgroundColor: card.value === 'service' ? 'rgba(25, 118, 210, 0.08)' : 'white',
                }}
              >
                <Box sx={{ mb: 1 }}>{card.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {card.label}
                </Typography>
              </HeaderCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      setLoading(true);
      apiClient
        .get(`/services/search?serviceName=${debouncedSearchQuery}`)
        .then((res) => {
          setSearchResults(res.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error searching services:", error);
          setLoading(false);
          showNotification({
            message: "Failed to search services. Please try again.",
            type: "error"
          });
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, showNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () =>
      document.removeEventListener('click', handleClickOutside, true);
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      if (vehicleId) {
        setLoading(true);
        try {
          const res = await apiClient.get(`/serviceUsed/getByVehicleId/${vehicleId}`);
          const mapped: InvoiceService[] = res.data.map((item: any) => ({
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            serviceRate: item.rate, // might be null
            totalGst: item.cGST + item.sGST,
            quantity: item.quantity,
            taxable: item.rate * item.quantity,
            total: item.rate * item.quantity,
            newService: false,
            vehicleServicesUsedId: item.vehicleServicesUsedId,
          }));
          setServices((prev) => [
            ...mapped,
            ...prev.filter((s) => s.newService)
          ]);
        } catch (error) {
          // If 404, just handle it silently (no services exist yet for this vehicle)
          const axiosError = error as { response?: { status: number } };
          if (axiosError.response?.status !== 404) {
            console.error("Error fetching services:", error);
            showNotification({
              message: "Failed to load services for this vehicle.",
              type: "error"
            });
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchServices();
  }, [vehicleId]); // Remove showNotification from dependencies to prevent infinite loops

  const addService = (service: Service) => {
    if (services.some((s) => s.serviceId === service.serviceId)) {
      setShowModal(true);
      return;
    }
    setServices((prev) => [
      ...prev,
      {
        ...service,
        quantity: 1,
        taxable: service.serviceRate ? service.serviceRate : 0,
        total: service.serviceRate ? service.serviceRate : 0,
        newService: true,
      }
    ]);
    setSearchQuery('');
    setSearchResults([]);
    showNotification({
      message: "Service added successfully",
      type: "success"
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setServices((prev) =>
      prev.map((service) =>
        service.serviceId === id
          ? {
              ...service,
              quantity,
              taxable: (service.serviceRate ?? 0) * quantity,
              total: (service.serviceRate ?? 0) * quantity,
            }
          : service
      )
    );
  };

  const removeNewService = (serviceId: number) => {
    setServices((prev) =>
      prev.filter((service) => !(service.newService && service.serviceId === serviceId))
    );
    showNotification({
      message: "Service removed",
      type: "info"
    });
  };

  const deleteUsedService = (vehicleServicesUsedId: number | undefined) => {
    if (!vehicleServicesUsedId) return;
    
    apiClient
      .delete(`/serviceUsed/delete/${vehicleServicesUsedId}`)
      .then((res) => {
        if (res.status >= 200 && res.status < 300) {
          setServices((prev) =>
            prev.filter(
              (s) => s.vehicleServicesUsedId !== vehicleServicesUsedId
            )
          );
          showNotification({
            message: "Service deleted successfully",
            type: "success"
          });
        } else {
          console.error('Failed to delete used service with id:', vehicleServicesUsedId);
          showNotification({
            message: "Failed to delete service",
            type: "error"
          });
        }
      })
      .catch(error => {
        console.error("Error deleting service:", error);
        showNotification({
          message: "Failed to delete service. Please try again.",
          type: "error"
        });
      });
  };

  const newServices = services.filter((s) => s.newService);
  const usedServices = services.filter((s) => !s.newService);

  const grandTotal = services.reduce((sum, service) => sum + (service.total ?? 0), 0);

  const saveInvoice = () => {
    if (!vehicleId) {
      showNotification({
        message: "Vehicle ID is missing",
        type: "error"
      });
      return;
    }
    
    if (newServices.length === 0) {
      showNotification({
        message: "No new services to save",
        type: "warning"
      });
      return;
    }
    
    setLoading(true);
    Promise.all(
      newServices.map((service) =>
        apiClient.post('/serviceUsed/AddService', {
          serviceName: service.serviceName,
          quantity: service.quantity,
          rate: service.serviceRate,
          cGST: 0,
          sGST: 0,
          vehicleId: parseInt(vehicleId, 10),
          date: new Date().toISOString().slice(0, 10)
        })
      )
    )
      .then((responses) => {
        setLoading(false);
        if (
          responses.every(
            (res) => res.status >= 200 && res.status < 300
          )
        ) {
          setServices((prev) =>
            prev.map((service) =>
              service.newService ? { ...service, newService: false } : service
            )
          );
          setShowSuccessModal(true);
        } else {
          showNotification({
            message: "One or more services failed to save",
            type: "error"
          });
        }
      })
      .catch(error => {
        console.error("Error saving services:", error);
        setLoading(false);
        showNotification({
          message: "Failed to save services. Please try again.",
          type: "error"
        });
      });
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="textSecondary">
          Vehicle ID: {vehicleId}
        </Typography>
      </Box>

      {renderHeaderCards()}

      <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Vehicle Services
        </Typography>

        <div ref={searchContainerRef}>
          <SearchInputWrapper>
            <StyledInputBase
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>

          {searchResults.length > 0 && (
            <SearchResultsContainer>
              {searchResults.map((result) => (
                <SearchResultItem
                  key={result.serviceId}
                  onClick={() => addService(result)}
                >
                  <Typography variant="subtitle2">{result.serviceName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rate: ₹{result.serviceRate?.toFixed(2) || '0.00'}
                  </Typography>
                </SearchResultItem>
              ))}
            </SearchResultsContainer>
          )}
        </div>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {newServices.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  New Services
                </Typography>
                <StyledTable>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: isMobile ? '10%' : '5%', textAlign: 'center' }}>#</th>
                        <th style={{ width: isMobile ? '40%' : '30%' }}>Service Name</th>
                        <th style={{ width: isMobile ? '20%' : '15%', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: isMobile ? '20%' : '15%', textAlign: 'right' }}>Rate</th>
                        {!isMobile && <th style={{ width: '10%', textAlign: 'right' }}>GST</th>}
                        <th style={{ width: isMobile ? '20%' : '15%', textAlign: 'right' }}>Total</th>
                        <th style={{ width: isMobile ? '15%' : '10%', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newServices.map((service, index) => (
                        <tr key={`new-${service.serviceId}`}>
                          <td style={{ textAlign: 'center' }}>{index + 1}</td>
                          <td>{service.serviceName}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => updateQuantity(service.serviceId, Math.max(1, service.quantity - 1))}
                                sx={{ minWidth: isMobile ? '24px' : '30px', p: 0, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                              >
                                -
                              </Button>
                              <Box sx={{ mx: 1, display: 'flex', alignItems: 'center', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {service.quantity}
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => updateQuantity(service.serviceId, service.quantity + 1)}
                                sx={{ minWidth: isMobile ? '24px' : '30px', p: 0, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                              >
                                +
                              </Button>
                            </Box>
                          </td>
                          <td style={{ textAlign: 'right' }}>₹{(service.serviceRate ?? 0).toFixed(2)}</td>
                          {!isMobile && <td style={{ textAlign: 'right' }}>0%</td>}
                          <td style={{ textAlign: 'right' }}>₹{(service.total ?? 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => removeNewService(service.serviceId)}
                              sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem', py: 0.5, px: isMobile ? 1 : 2 }}
                            >
                              {isMobile ? 'Del' : 'Delete'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </StyledTable>
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Used Services
              </Typography>
              {usedServices.length > 0 ? (
                <StyledTable>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: isMobile ? '10%' : '5%', textAlign: 'center' }}>#</th>
                        {!isMobile && <th style={{ width: '10%', textAlign: 'center' }}>ID</th>}
                        <th style={{ width: isMobile ? '40%' : '30%' }}>Service Name</th>
                        <th style={{ width: isMobile ? '15%' : '10%', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: isMobile ? '20%' : '15%', textAlign: 'right' }}>Rate</th>
                        {!isMobile && <th style={{ width: '10%', textAlign: 'right' }}>GST</th>}
                        <th style={{ width: isMobile ? '20%' : '15%', textAlign: 'right' }}>Total</th>
                        <th style={{ width: isMobile ? '15%' : '10%', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usedServices.map((service, index) => (
                        <tr key={`used-${service.vehicleServicesUsedId || service.serviceId}`}>
                          <td style={{ textAlign: 'center' }}>{index + 1}</td>
                          {!isMobile && (
                            <td style={{ textAlign: 'center' }}>
                              {service.vehicleServicesUsedId || service.serviceId}
                            </td>
                          )}
                          <td>{service.serviceName}</td>
                          <td style={{ textAlign: 'center' }}>{service.quantity}</td>
                          <td style={{ textAlign: 'right' }}>₹{(service.serviceRate ?? 0).toFixed(2)}</td>
                          {!isMobile && <td style={{ textAlign: 'right' }}>0%</td>}
                          <td style={{ textAlign: 'right' }}>₹{(service.total ?? 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => deleteUsedService(service.vehicleServicesUsedId)}
                              sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem', py: 0.5, px: isMobile ? 1 : 2 }}
                            >
                              {isMobile ? 'Del' : 'Delete'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </StyledTable>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No used services found.
                  </Typography>
                </Paper>
              )}
            </Box>

            <Box sx={{ mt: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                Total Amount: ₹{grandTotal.toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={saveInvoice}
                disabled={newServices.length === 0}
                sx={{ mt: isMobile ? 2 : 0, py: 1 }}
              >
                Save Service Invoice
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Already added service modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Service Already Added</DialogTitle>
        <DialogContent>
          <Typography>
            This service is already in your list. You can adjust the quantity if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success modal */}
      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            All services have been saved successfully.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessModal(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceTab;
