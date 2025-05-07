import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Stack,
  styled,
  TextField,
  CircularProgress,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";
import apiClient from "Services/apiService";
import { useNavigate } from "react-router-dom";

const EditIcon = FaEdit as unknown as React.FC<any>;
const TrashIcon = FaTrash as unknown as React.FC<any>;

interface ServiceData {
  serviceId: number;
  serviceName: string;
  serviceRate: number;
  totalGst: number;
}

// Cache configuration
const CACHE_KEY = 'services_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Global services cache
let servicesCache = {
  data: null as ServiceData[] | null,
  timestamp: 0
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(3),
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

const SuccessCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
  textAlign: "center",
  backgroundColor: theme.palette.success.light,
  color: theme.palette.success.contrastText,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
}));

const GetAllServices: React.FC = () => {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Try to load from localStorage on component initialization
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setServices(data);
          setLoading(false);
          // Still fetch in background to update cache
          fetchServices(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error reading from cache:", error);
    }
    
    // No valid cache, load fresh data
    fetchServices(true);
  }, []);

  const fetchServices = useCallback(async (showLoading = true) => {
    // Check in-memory cache first
    if (!showLoading && servicesCache.data && (Date.now() - servicesCache.timestamp < CACHE_DURATION)) {
      setServices(servicesCache.data);
      return;
    }
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await apiClient.get("/services/getAll");
      const data = response.data;
      
      // Update state
      setServices(data);
      setLoading(false);
      
      // Update in-memory cache
      servicesCache = {
        data,
        timestamp: Date.now()
      };
      
      // Update localStorage cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    } catch (error: any) {
      setLoading(false);
      setMessage(
        "Error fetching services: " +
          (error.response?.data?.message || error.message)
      );
    }
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/admin/editService/${id}`);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const confirmDeleteService = async () => {
    if (deleteId !== null) {
      try {
        await apiClient.delete(`/services/delete/${deleteId}`);
        setMessage("Service deleted successfully.");
        
        // Clear caches after mutation
        servicesCache = { data: null, timestamp: 0 };
        localStorage.removeItem(CACHE_KEY);
        
        fetchServices();
      } catch (error: any) {
        setMessage(
          "Error deleting service: " +
            (error.response?.data?.message || error.message)
        );
      }
      setConfirmDelete(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
    setDeleteId(null);
  };

  const filteredServices = services.filter((service) =>
    Object.values(service).some((value) =>
      String(value)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <StyledPaper>
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}
        >
          All Services
        </Typography>
        {message && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mb: 2, textAlign: "center" }}
          >
            {message}
          </Typography>
        )}
        <TextField
          label="Search Services"
          variant="outlined"
          fullWidth
          sx={{ mb: 3 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>S.No</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Service Rate</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServices.map((service, index) => (
                  <TableRow key={service.serviceId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{service.serviceName}</TableCell>
                    <TableCell>{service.serviceRate}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          onClick={() => handleEdit(service.serviceId)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(service.serviceId)}
                          color="error"
                        >
                          <TrashIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>
      {confirmDelete && (
        <Paper
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              width: "300px",
              textAlign: "center",
            }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this service?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={confirmDeleteService}
              >
                Delete
              </Button>
            </Stack>
          </Paper>
        </Paper>
      )}
    </Box>
  );
};

export default GetAllServices;
