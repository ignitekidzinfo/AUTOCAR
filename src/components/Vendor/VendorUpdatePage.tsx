import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Grid,
  InputAdornment
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import apiClient from "Services/apiService";

import { FaUser, FaFileInvoiceDollar, FaMapMarkerAlt, FaPhone, FaIdCard, FaClipboardList } from "react-icons/fa";

const UserIcon = FaUser as React.FC<{ style?: React.CSSProperties }>;
const FileInvoiceIcon = FaFileInvoiceDollar as React.FC<{ style?: React.CSSProperties }>;
const MapMarkerIcon = FaMapMarkerAlt as React.FC<{ style?: React.CSSProperties }>;
const PhoneIcon = FaPhone as React.FC<{ style?: React.CSSProperties }>;
const IdCardIcon = FaIdCard as React.FC<{ style?: React.CSSProperties }>;
const ClipboardIcon = FaClipboardList as React.FC<{ style?: React.CSSProperties }>;
interface VendorDto {
  vendorId?: number;
  name: string;
  gstno: string;        
  address: string;
  mobileNumber: string;
  panNo: string;
  spareBrand: string;    
}

const CustomPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  backgroundColor: "#ffffff",
  width: "100%", 
  margin: theme.spacing(2, 0),
}));

const VendorUpdatePage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState<VendorDto>({
    name: "",
    gstno: "",        
    address: "",
    mobileNumber: "",
    panNo: "",
    spareBrand: ""      
  });

  const fetchVendorDetails = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/vendor/findById?vendorId=${vendorId}`);
      const data = res.data.body ? res.data.body : res.data;
      const vendor: VendorDto = {
        vendorId: data.vendorId,
        name: data.name,
        address: data.address,
        mobileNumber: data.mobileNumber.toString(),
        panNo: data.panNo,
        gstno: data.gstno,             
        spareBrand: data.spareBrand || "" 
      };
      setFormData(vendor);
    } catch (error) {
      console.error("Error fetching vendor details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [vendorId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpdate = async () => {
    if (!vendorId) return;
    try {
      await apiClient.patch(`/vendor/update/${vendorId}`, formData);
      navigate("/admin/vendorManagement");
    } catch (error) {
      console.error("Error updating vendor", error);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        padding: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          mb: 2,
          fontWeight: "bold",
          textAlign: "center",
          color: theme.palette.primary.main,
        }}
      >
        Update Supplier
      </Typography>
      {loading ? (
        <Typography align="center">Loading vendor details...</Typography>
      ) : (
        <CustomPaper>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon style={{ marginRight: 8, color: theme.palette.primary.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="GST No"
                name="gstno" 
                value={formData.gstno}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FileInvoiceIcon style={{ marginRight: 8, color: theme.palette.secondary.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MapMarkerIcon style={{ marginRight: 8, color: theme.palette.error.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mobile Number"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon style={{ marginRight: 8, color: theme.palette.success.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="PAN No"
                name="panNo"
                value={formData.panNo}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IdCardIcon style={{ marginRight: 8, color: theme.palette.info.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Spare Brand"
                name="sparesBrandName" 
                value={formData.spareBrand} 
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    spareBrand: e.target.value,
                  }))
                }
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ClipboardIcon style={{ marginRight: 8, color: theme.palette.warning.main }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" color="primary" onClick={handleUpdate}>
              Update
            </Button>
            <Button variant="outlined" onClick={() => navigate("/supplier/list")}>
              Cancel
            </Button>
          </Box>
        </CustomPaper>
      )}
    </Box>
  );
};

export default VendorUpdatePage;
