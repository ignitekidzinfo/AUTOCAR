import React, { useEffect, useState, FormEvent } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  styled,
  Snackbar,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "Services/apiService";

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

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: "none",
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

const EditService: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ServiceData>({
    serviceId: 0,
    serviceName: "",
    serviceRate: 0,
    totalGst: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.get(`/services/getById/${id}`);
        setFormData(response.data);
      } catch (error: any) {
        setMessage(
          "Error fetching service: " +
            (error.response?.data?.message || error.message)
        );
      }
    };
    fetchService();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "serviceName" ? value : Number(value) || 0,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.patch(`/services/update/${id}`, formData);
      setSnackbarSeverity("success");
      setSnackbarMessage("Service updated successfully.");
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarSeverity("error");
      setSnackbarMessage(
        "Error updating service: " +
          (error.response?.data?.message || error.message)
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const confirmDeleteService = async () => {
    try {
      await apiClient.delete(`/services/${id}`);
      setSnackbarSeverity("success");
      setSnackbarMessage("Service deleted successfully.");
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarSeverity("error");
      setSnackbarMessage(
        "Error deleting service: " +
          (error.response?.data?.message || error.message)
      );
      setSnackbarOpen(true);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
  };
  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
    navigate("/admin/manageService");
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <StyledPaper>
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}
        >
          Edit Service
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
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Service Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Service Name"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              required
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Service Rate <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Service Rate"
              name="serviceRate"
              // If value is 0, show empty string
              value={formData.serviceRate === 0 ? "" : formData.serviceRate}
              onChange={handleChange}
              required
              size="small"
              type="number"
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Total GST <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Total GST"
              name="totalGst"
              value={formData.totalGst === 0 ? "" : formData.totalGst}
              onChange={handleChange}
              required
              size="small"
              type="number"
            />
          </Box>
          <Stack direction="row" spacing={2} justifyContent="center">
            <StyledButton
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </StyledButton>
            <StyledButton
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/admin/manageService")}
            >
              Cancel
            </StyledButton>
            <StyledButton
              variant="outlined"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </StyledButton>
          </Stack>
        </Box>
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
            sx={{ p: 3, borderRadius: 2, width: "300px", textAlign: "center" }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this service?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={confirmDeleteService}>
                Delete
              </Button>
            </Stack>
          </Paper>
        </Paper>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditService;
export {};
