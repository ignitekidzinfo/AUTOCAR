import React, { useEffect, useState } from "react";
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
  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      const response = await apiClient.get("/services/getAll");
      setServices(response.data);
    } catch (error: any) {
      setMessage(
        "Error fetching services: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  useEffect(() => {
    fetchServices();
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
        await apiClient.delete(`/services/${deleteId}`);
        setMessage("Service deleted successfully.");
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
      value
        .toString()
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
