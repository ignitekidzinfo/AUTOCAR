import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  InputAdornment,
  Snackbar,
  Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import apiClient from "Services/apiService";
import { useNavigate } from "react-router-dom";

// Import react-icons for modern adornments
import { FaUser, FaPhone, FaFileInvoiceDollar, FaClipboardList, FaMapMarkerAlt, FaEnvelope, FaIdCard } from "react-icons/fa";

// Type cast react-icons
const UserIcon = FaUser as React.FC<{ style?: React.CSSProperties }>;
const PhoneIcon = FaPhone as React.FC<{ style?: React.CSSProperties }>;
const FileInvoiceIcon = FaFileInvoiceDollar as React.FC<{ style?: React.CSSProperties }>;
const ClipboardIcon = FaClipboardList as React.FC<{ style?: React.CSSProperties }>;
const MapMarkerIcon = FaMapMarkerAlt as React.FC<{ style?: React.CSSProperties }>;
const EnvelopeIcon = FaEnvelope as React.FC<{ style?: React.CSSProperties }>;
const IdCardIcon = FaIdCard as React.FC<{ style?: React.CSSProperties }>;

interface SupplierFormData {
  name: string;
  address: string;
  mobileNumber: string;
  email: string;
  gstno: string;
  panNo: string;
  spareBrand: string;
}

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
  boxShadow: "0px 4px 20px rgba(0,0,0,0.1)"
}));

const AddNewSupplierPage: React.FC = () => {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    address: "",
    mobileNumber: "",
    email: "",
    gstno: "",
    panNo: "",
    spareBrand: ""
  });
  const [mobileError, setMobileError] = useState<string>("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const navigate = useNavigate();

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Validate mobile number: 10 digits only (adjust regex as needed)
  const isValidMobile = (mobile: string): boolean => {
    const regex = /^[0-9]{10}$/;
    return regex.test(mobile);
  };

  const handleSubmit = async () => {
    // Validate mobile number
    if (!isValidMobile(formData.mobileNumber)) {
      setMobileError("Mobile number must be 10 digits.");
      return;
    } else {
      setMobileError("");
    }

    try {
      const response = await apiClient.post("/vendor/registerVendor", formData);
      setSnackbar({ open: true, message: "Supplier registered successfully!", severity: "success" });
      console.log("Form Data Submitted:", formData);
      setTimeout(() => {
        navigate("/admin/vendorManagement");
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSnackbar({ open: true, message: "Error registering supplier.", severity: "error" });
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      address: "",
      mobileNumber: "",
      email: "",
      gstno: "",
      panNo: "",
      spareBrand: ""
    });
    setMobileError("");
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: "#e0e0e0", minHeight: "100vh" }}>
      <CustomPaper>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}>
          Add New Supplier
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Supplier's Name"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon style={{ marginRight: 8, color: "#1976d2" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>Name *</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="Mobile Number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="Enter Supplier's Mobile Number"
                variant="outlined"
                error={!!mobileError}
                helperText={mobileError || "Mobile Number *"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon style={{ marginRight: 8, color: "#388e3c" }} />
                    </InputAdornment>
                  )
                }}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="GST No"
                name="gstno"
                value={formData.gstno}
                onChange={handleChange}
                placeholder="Enter Supplier's GST No"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FileInvoiceIcon style={{ marginRight: 8, color: "#f57c00" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>GST No *</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                multiline
                rows={3}
                label="Spare Brand"
                name="spareBrand"
                value={formData.spareBrand}
                onChange={handleChange}
                placeholder="Enter Supplier's Spare Brand"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ClipboardIcon style={{ marginRight: 8, color: "#6d4c41" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>Spare Brand</FormHelperText>
            </FormControl>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter Supplier's Address"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MapMarkerIcon style={{ marginRight: 8, color: "#d32f2f" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>Address *</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Supplier's Email"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EnvelopeIcon style={{ marginRight: 8, color: "#1976d2" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>Email *</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                required
                label="PAN No"
                name="panNo"
                value={formData.panNo}
                onChange={handleChange}
                placeholder="Enter Supplier's PAN No."
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IdCardIcon style={{ marginRight: 8, color: "#512da8" }} />
                    </InputAdornment>
                  )
                }}
              />
              <FormHelperText>PAN No *</FormHelperText>
            </FormControl>
          </Grid>

          {/* Submit and Reset Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                Submit
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleReset}>
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CustomPaper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: "40vh" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddNewSupplierPage;
