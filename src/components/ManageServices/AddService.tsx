import React, { useState, FormEvent } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  styled,
} from "@mui/material";
import apiClient from "Services/apiService";

interface ServiceFormData {
  serviceName: string;
  serviceRate: number;
  totalGst: number;
}

const initialFormData: ServiceFormData = {
  serviceName: "",
  serviceRate: 0,
  totalGst: 0,
};

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

const AddService: React.FC = () => {
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "serviceName" ? value : Number(value),
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.serviceName.trim() || formData.serviceRate <= 0 || formData.totalGst < 0) {
      setErrorMsg("Please fill in all required fields correctly.");
      return;
    }
    setErrorMsg("");
    try {
      setLoading(true);
      const response = await apiClient.post("/services/AddService", formData);
      console.log("Service added successfully:", response.data);
      setSuccessMsg("Service added successfully!");
      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error adding service:", error);
      setErrorMsg(error.response?.data?.message || "Error adding service");
      setSuccessMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <StyledPaper>
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}
        >
          Add New Service
        </Typography>
        {errorMsg && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mb: 2, textAlign: "center" }}
          >
            {errorMsg}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Service Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Service Name"
              value={formData.serviceName}
              onChange={handleChange}
              required
              size="small"
              name="serviceName"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Service Rate <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Service Rate"
              value={formData.serviceRate}
              onChange={handleChange}
              required
              size="small"
              name="serviceRate"
              type="number"
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Total GST <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Total GST"
              value={formData.totalGst}
              onChange={handleChange}
              required
              size="small"
              name="totalGst"
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
              {loading ? "Submitting..." : "Submit"}
            </StyledButton>
            <StyledButton
              variant="outlined"
              color="secondary"
              onClick={() => setFormData(initialFormData)}
            >
              Reset
            </StyledButton>
          </Stack>
        </Box>
      </StyledPaper>
      {successMsg && (
        <SuccessCard>
          <Typography variant="h6">{successMsg}</Typography>
        </SuccessCard>
      )}
    </Box>
  );
};

export default AddService;
