import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormLabel,
  OutlinedInput,
  FormHelperText,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  styled,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { SelectChangeEvent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleAdd, VehicleDataByID, VehicleUpdate } from 'Services/vehicleService';
import apiClient from 'Services/apiService';

export interface VehicleRegDto {
  vehicleRegId: string;
  appointmentId: string | null;
  vehicleNumber: string;
  vehicleBrand: string;
  vehicleModelName: string;
  engineNumber: string;
  chasisNumber: string;
  numberPlateColour: string;
  customerId: string | null;
  customerName: string;
  customerAddress: string;
  customerMobileNumber: string;
  customerAadharNo: string;
  customerGstin: string;
  email: string;
  superwiser: string;
  technician: string;
  worker: string;
  vehicleInspection: string;
  jobcard: string;
  kmsDriven?: number | string;
  status: "Waiting" | "In Progress" | "Complete";
  userId: string;
  date: string;
  insuranceStatus: "Insured" | "Expired";
  insuranceFrom: string | null;
  insuranceTo: string | null;
  vehicleVariant: string; 
  manufactureYear: number | string;
  advancePayment?: number | string;
}

export interface VehicleFormData {
  vehicleRegId?: string;
  appointmentId: string;
  vehicleNumber: string;
  vehicleBrand: string;
  vehicleModelName: string;
  engineNumber: string;
  chasisNumber: string;
  numberPlateColour: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerMobileNumber: string;
  customerAadharNo: string;
  customerGstin: string;
  email: string;
  superwiser: string;
  technician: string;
  worker: string;
  vehicleInspection: string;
  kmsDriven: number | string;
  status: "Waiting" | "In Progress" | "Complete";
  userId: string;
  date: string;
  insuranceStatus: "Insured" | "Expired";
  insuranceFrom: string;
  insuranceTo: string;
  fuelType: string;
  manufactureYear: string;
  advancePayment: number | string;
}

const initialFormData: VehicleFormData = {
  vehicleRegId: "",
  appointmentId: "",
  vehicleNumber: "",
  vehicleBrand: "",
  vehicleModelName: "",
  engineNumber: "",
  chasisNumber: "",
  numberPlateColour: "",
  customerId: "",
  customerName: "",
  customerAddress: "",
  customerMobileNumber: "",
  customerAadharNo: "",
  customerGstin: "",
  email: "",
  superwiser: "",
  technician: "",
  worker: "",
  vehicleInspection: "",
  kmsDriven: 0,
  status: "Waiting",
  userId: "",
  date: "",
  insuranceStatus: "Expired",
  insuranceFrom: "",
  insuranceTo: "",
  fuelType: "",
  manufactureYear: "",
  advancePayment: 0,
};

const ContainerBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  width: '100%',
  maxWidth: '100%',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    gap: theme.spacing(1),
  },
}));

// Form container styling to match the design
const FormContainer = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
  },
}));

const FormColumn = styled(Grid)(({ theme }) => ({
  flex: '1 1 48%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    flex: '1 1 100%',
  },
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  width: '100%',
  overflowX: 'hidden',
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1),
    borderRadius: theme.spacing(0.5),
  },
}));

const SectionCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[800] 
    : theme.palette.grey[100],
  color: theme.palette.text.primary,
  padding: theme.spacing(0.75, 2),
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 500
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    '& .MuiCardHeader-title': {
      fontSize: '0.9rem',
    }
  },
}));

const SectionCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

const ResponsiveGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    '& .MuiGrid-item': {
      paddingTop: theme.spacing(0.75),
      paddingBottom: theme.spacing(0.75),
    }
  }
}));

export default function AddVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string; insuranceTo?: string }>({});

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<VehicleRegDto[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRegDto | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setErrors((prev) => ({ ...prev, [event.target.name]: "" }));
    setFormData({ ...formData, [event.target.name]: event.target.value || "" });
  };

  const handleSelectChange = (event: SelectChangeEvent<"Waiting" | "In Progress" | "Complete">) => {
    setFormData({ ...formData, status: event.target.value as VehicleFormData["status"] });
  };

  const handleInsuranceStatusChange = (event: SelectChangeEvent<"Insured" | "Expired">) => {
    setFormData({ ...formData, insuranceStatus: event.target.value as "Insured" | "Expired" });
  };

  const handleFuelTypeChange = (event: SelectChangeEvent<string>) => {
    setFormData({ ...formData, fuelType: event.target.value || "" });
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const validateFields = (): boolean => {
    const newErrors: { email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string; insuranceTo?: string } = {};
    if (!formData.customerName.trim()) newErrors.customerName = "Customer name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
    }
    if (!formData.customerMobileNumber.trim()) {
      newErrors.customerMobileNumber = "Mobile number is required";
    } else {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(formData.customerMobileNumber)) newErrors.customerMobileNumber = "Mobile number must be exactly 10 digits";
    }
    if (!formData.kmsDriven || formData.kmsDriven.toString().trim() === "" || Number(formData.kmsDriven) === 0) {
      newErrors.kmsDriven = "Kilometer Driven is required";
    }
    if (formData.insuranceStatus === "Expired" && !formData.insuranceTo) {
      newErrors.insuranceTo = "Expired At date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateFields()) return;
    try {
      const { fuelType, insuranceFrom, insuranceTo, ...restData } = formData;
      
      // Create payload with proper field mapping to match backend DTO
      const payload = { 
        ...restData, 
        vehicleVariant: fuelType, 
        status: id ? formData.status : "Waiting",
        // Map to correct field names in the backend
        insuredFrom: insuranceFrom || null,
        insuredTo: insuranceTo || null
      };
      
      console.log("Sending payload:", payload);
      
      let response: any = "";
      if (id) {
        response = await VehicleUpdate(payload);
      } else {
        response = await VehicleAdd(payload);
      }
      console.log("Vehicle operation successful:", response);
      setDialogTitle("Success");
      setDialogMessage(`Vehicle ${id ? "updated" : "added"} successfully!`);
      setDialogOpen(true);
      if (!id) {
        const generatedId = response.data.vehicleRegId;
        navigate(`/admin/vehicle/add/servicepart/${generatedId}`);
        resetForm();
      }
    } catch (error: any) {
      console.error("Error processing vehicle:", error);
      let errorMsg = "Failed to process vehicle.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setDialogTitle("Error");
      setDialogMessage(errorMsg);
      setDialogOpen(true);
    }
  };
  React.useEffect(() => {
    if (id) {
      const getVehicleData = async () => {
        try {
          const response = await VehicleDataByID(id);
          setFormData({
            vehicleRegId: response.vehicleRegId || "",
            appointmentId: response.appointmentId || "",
            vehicleNumber: response.vehicleNumber || "",
            vehicleBrand: response.vehicleBrand || "",
            vehicleModelName: response.vehicleModelName || "",
            engineNumber: response.engineNumber || "",
            chasisNumber: response.chasisNumber || "",
            numberPlateColour: response.numberPlateColour || "",
            customerId: response.customerId || "",
            customerName: response.customerName || "",
            customerAddress: response.customerAddress || "",
            customerMobileNumber: response.customerMobileNumber || "",
            customerAadharNo: response.customerAadharNo || "",
            customerGstin: response.customerGstin || "",
            email: response.email || "",
            superwiser: response.superwiser || "",
            technician: response.technician || "",
            worker: response.worker || "",
            vehicleInspection: response.vehicleInspection || "",
            kmsDriven: response.kmsDriven || "",
            status: response.status || "Waiting",
            userId: response.userId || "",
            date: response.date || "",
            insuranceStatus: response.insuranceStatus || "Expired",
            // Map from backend field names to frontend field names
            insuranceFrom: response.insuredFrom || "",
            insuranceTo: response.insuredTo || "",
            fuelType: response.vehicleVariant || "",
            manufactureYear: response.manufactureYear ? String(response.manufactureYear) : "",
            advancePayment: response.advancePayment || 0,
          });
        } catch (error) {
          console.error("Error fetching vehicle data:", error);
        }
      };
      getVehicleData();
    }
  }, [id]);
  React.useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchInput.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const response = await apiClient.get<VehicleRegDto[]>("/vehicle-reg/search", {
          params: { query: searchInput },
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };
    fetchSearchResults();
  }, [searchInput]);
  const handleVehicleSelect = (event: any, value: VehicleRegDto | null) => {
    setSelectedVehicle(value);
    if (value) {
      setFormData({
        ...initialFormData,
        vehicleNumber: value.vehicleNumber || "",
        vehicleBrand: value.vehicleBrand || "",
        vehicleModelName: value.vehicleModelName || "",
        engineNumber: value.engineNumber || "",
        chasisNumber: value.chasisNumber || "",
        numberPlateColour: value.numberPlateColour || "",
        customerName: value.customerName || "",
        customerAddress: value.customerAddress || "",
        customerMobileNumber: value.customerMobileNumber || "",
        customerAadharNo: value.customerAadharNo || "",
        customerGstin: value.customerGstin || "",
        email: value.email || "",
        fuelType: value.vehicleVariant || "",
        manufactureYear: value.manufactureYear ? String(value.manufactureYear) : "",
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData(initialFormData);
    }
  };

  return (
    <ContainerBox>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography component="h2" variant="h6">
          {id ? "Update " : "Add New "}Vehicle
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>
      
      <Autocomplete
        options={searchResults}
        getOptionLabel={(option) => option.vehicleNumber}
        value={selectedVehicle}
        onChange={handleVehicleSelect}
        onInputChange={(event, newInputValue) => setSearchInput(newInputValue)}
        renderOption={(props, option) => (
          <li {...props} key={option.vehicleRegId}>
            {option.vehicleNumber}
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Appointment Vehicle No" variant="outlined" fullWidth margin="normal" />
        )}
      />
      
      <form onSubmit={handleSubmit}>
        <FormContainer container>
          {/* VEHICLE DETAILS CARD */}
          <SectionCard>
            <SectionCardHeader title="Vehicle Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                <Grid item xs={12} sm={6}>
                  {/* Vehicle No */}
                  <FormGrid>
                    <FormLabel htmlFor="vehicleNumber">Vehicle No*</FormLabel>
            <OutlinedInput
              id="vehicleNumber"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
                      placeholder="Enter/Select Vehicle No"
                      required
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Number Plate Colour */}
                  <FormGrid>
                    <FormLabel htmlFor="numberPlateColour">Number Plate Colour*</FormLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        id="numberPlateColour"
                        name="numberPlateColour"
                        value={formData.numberPlateColour}
                        onChange={(e: SelectChangeEvent) => setFormData({...formData, numberPlateColour: e.target.value})}
                        required
                      >
                        <MenuItem value="">Select Number Plate Colour</MenuItem>
                        <MenuItem value="White">White</MenuItem>
                        <MenuItem value="Yellow">Yellow</MenuItem>
                        <MenuItem value="Green">Green</MenuItem>
                        <MenuItem value="Blue">Blue</MenuItem>
                        <MenuItem value="Red">Red</MenuItem>
                      </Select>
                    </FormControl>
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Vehicle Maker */}
                  <FormGrid>
                    <FormLabel htmlFor="vehicleBrand">Vehicle Maker*</FormLabel>
                    <OutlinedInput
                      id="vehicleBrand"
                      name="vehicleBrand"
                      value={formData.vehicleBrand}
                      onChange={handleChange}
                      placeholder="Enter/Select Vehicle Maker"
                      required
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Engine Number */}
                  <FormGrid>
                    <FormLabel htmlFor="engineNumber">Engine Number</FormLabel>
                    <OutlinedInput
                      id="engineNumber"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleChange}
                      placeholder="Enter Engine Number"
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Model Line */}
                  <FormGrid>
                    <FormLabel htmlFor="vehicleModelName">Model Line*</FormLabel>
                    <OutlinedInput
                      id="vehicleModelName"
                      name="vehicleModelName"
                      value={formData.vehicleModelName}
                      onChange={handleChange}
                      placeholder="Enter/Select Vehicle Model Line"
                      required
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Sitting Capacity */}
                  <FormGrid>
                    <FormLabel htmlFor="vehicleInspection">Sitting Capacity</FormLabel>
                    <OutlinedInput
                      id="vehicleInspection"
                      name="vehicleInspection"
                      value={formData.vehicleInspection}
                      onChange={handleChange}
                      placeholder="Enter Sitting Capacity"
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Variant */}
                  <FormGrid>
                    <FormLabel htmlFor="fuelType">Variant*</FormLabel>
                    <OutlinedInput
                      id="fuelType"
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      placeholder="Enter/Select Vehicle Variant"
              required
              size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* CC Engine */}
                  <FormGrid>
                    <FormLabel htmlFor="ccEngine">CC Engine</FormLabel>
                    <OutlinedInput
                      id="ccEngine"
                      name="ccEngine"
                      placeholder="Enter Engine CC"
                      size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Fuel Type */}
                  <FormGrid>
                    <FormLabel htmlFor="fuelType">Fuel Type*</FormLabel>
            <FormControl fullWidth size="small">
              <Select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleFuelTypeChange}
                required
              >
                <MenuItem value="">Select Fuel Type</MenuItem>
                <MenuItem value="Petrol">Petrol</MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
                <MenuItem value="CNG">CNG</MenuItem>
                <MenuItem value="Electric">Electric</MenuItem>
              </Select>
            </FormControl>
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Manufactured Year */}
                  <FormGrid>
                    <FormLabel htmlFor="manufactureYear">Manufactured Year</FormLabel>
            <OutlinedInput
              id="manufactureYear"
              name="manufactureYear"
              value={formData.manufactureYear}
              onChange={handleChange}
                      placeholder="---------, ----"
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Kilometer Driven */}
                  <FormGrid>
            <FormLabel htmlFor="kmsDriven">Kilometer Driven</FormLabel>
            <OutlinedInput
              id="kmsDriven"
              name="kmsDriven"
              value={formData.kmsDriven}
              onChange={handleChange}
              placeholder="Enter Kilometer Driven"
              size="small"
              error={Boolean(errors.kmsDriven)}
                      fullWidth
            />
            {errors.kmsDriven && <FormHelperText error>{errors.kmsDriven}</FormHelperText>}
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Date of Admission */}
                  <FormGrid>
            <FormLabel htmlFor="date">Date Of Admission</FormLabel>
            <OutlinedInput
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {/* Chasis Number */}
                  <FormGrid>
            <FormLabel htmlFor="chasisNumber">Chasis Number</FormLabel>
            <OutlinedInput
              id="chasisNumber"
              name="chasisNumber"
              value={formData.chasisNumber}
              onChange={handleChange}
              placeholder="Enter Chasis Number"
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
              </ResponsiveGrid>
            
              {/* Status section for updates */}
              {id && (
                <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select value={formData.status} label="Status" onChange={handleSelectChange} required>
                        <MenuItem value="Waiting">Waiting</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Complete">Complete</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </ResponsiveGrid>
              )}
              
              {/* Insurance section */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" component="h3" sx={{ mb: 2 }}>
                Insurance Information
              </Typography>
              
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormLabel htmlFor="insuranceStatus">Insurance Status</FormLabel>
                  <FormControl fullWidth size="small">
                    <Select id="insuranceStatus" name="insuranceStatus" value={formData.insuranceStatus} onChange={handleInsuranceStatusChange} required>
                      <MenuItem value="Insured">Insured</MenuItem>
                      <MenuItem value="Expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {formData.insuranceStatus === "Insured" && (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormLabel htmlFor="insuranceFrom">Insurance From</FormLabel>
                      <OutlinedInput id="insuranceFrom" name="insuranceFrom" type="date" value={formData.insuranceFrom} onChange={handleChange} required={!id} size="small" fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormLabel htmlFor="insuranceTo">Insurance To</FormLabel>
                      <OutlinedInput id="insuranceTo" name="insuranceTo" type="date" value={formData.insuranceTo} onChange={handleChange} required={!id} size="small" fullWidth />
                    </Grid>
                  </>
                )}
                
                {formData.insuranceStatus === "Expired" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <FormLabel htmlFor="insuranceTo">Expired At</FormLabel>
                    <OutlinedInput 
                      id="insuranceTo" 
                      name="insuranceTo" 
                      type="date" 
                      value={formData.insuranceTo} 
                      onChange={handleChange} 
              required
              size="small"
                      fullWidth
                    />
                  </Grid>
                )}
              </ResponsiveGrid>
            </SectionCardContent>
          </SectionCard>
          
          {/* CUSTOMER DETAILS CARD */}
          <SectionCard>
            <SectionCardHeader title="Customer Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Customer Name */}
                  <FormGrid>
                    <FormLabel htmlFor="customerName">Customer Name*</FormLabel>
            <OutlinedInput
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
              onChange={handleChange}
                      placeholder="Enter Customer Name"
              required
              size="small"
                      error={Boolean(errors.customerName)}
                      fullWidth
            />
                    {errors.customerName && <FormHelperText error>{errors.customerName}</FormHelperText>}
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  
                  <FormGrid>
                    <FormLabel htmlFor="customerMobileNumber">Mobile No*</FormLabel>
            <OutlinedInput
              id="customerMobileNumber"
              name="customerMobileNumber"
              value={formData.customerMobileNumber}
              onChange={handleChange}
                      placeholder="Enter Mobile No"
              required
              size="small"
              error={Boolean(errors.customerMobileNumber)}
                      fullWidth
            />
            {errors.customerMobileNumber && <FormHelperText error>{errors.customerMobileNumber}</FormHelperText>}
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Email Id */}
                  <FormGrid>
                    <FormLabel htmlFor="email">Email Id</FormLabel>
            <OutlinedInput
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
                      placeholder="Enter Email Id"
              size="small"
              error={Boolean(errors.email)}
                      fullWidth
            />
            {errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Customer Address */}
                  <FormGrid>
                    <FormLabel htmlFor="customerAddress">Customer Address*</FormLabel>
                    <OutlinedInput
                      id="customerAddress"
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleChange}
                      placeholder="Enter Customer Address"
                      required
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Customer Aadhar No */}
                  <FormGrid>
                    <FormLabel htmlFor="customerAadharNo">Customer Aadhar No.*</FormLabel>
            <OutlinedInput
              id="customerAadharNo"
              name="customerAadharNo"
              value={formData.customerAadharNo}
              onChange={handleChange}
                      placeholder="Enter Customer Aadhar No."
              required
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Customer GSTIN */}
                  <FormGrid>
            <FormLabel htmlFor="customerGstin">Customer GSTIN</FormLabel>
            <OutlinedInput
              id="customerGstin"
              name="customerGstin"
              value={formData.customerGstin}
              onChange={handleChange}
                      placeholder="Enter Customer GST No."
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Advance Payment */}
                  <FormGrid>
                    <FormLabel htmlFor="advancePayment">Advance Payment*</FormLabel>
            <OutlinedInput
                      id="advancePayment" 
                      name="advancePayment" 
                      type="number" 
                      value={formData.advancePayment} 
              onChange={handleChange}
                      placeholder="Enter Advance Payment" 
              required
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
              </ResponsiveGrid>
            </SectionCardContent>
          </SectionCard>
          
          {/* STAFF DETAILS CARD */}
          <SectionCard>
            <SectionCardHeader title="Staff Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  {/* Supervisor */}
                  <FormGrid>
                    <FormLabel htmlFor="superwiser">Superwiser*</FormLabel>
            <OutlinedInput
              id="superwiser"
              name="superwiser"
              value={formData.superwiser}
              onChange={handleChange}
                      placeholder="Enter/Select Superwiser"
              required
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Technician */}
                  <FormGrid>
                    <FormLabel htmlFor="technician">Technician*</FormLabel>
            <OutlinedInput
              id="technician"
              name="technician"
              value={formData.technician}
              onChange={handleChange}
                      placeholder="You can select multiple options"
              required
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  {/* Worker */}
                  <FormGrid>
                    <FormLabel htmlFor="worker">Worker*</FormLabel>
            <OutlinedInput
              id="worker"
              name="worker"
              value={formData.worker}
              onChange={handleChange}
                      placeholder="You can select multiple options"
              required
              size="small"
                      fullWidth
            />
          </FormGrid>
                </Grid>
              </ResponsiveGrid>
            </SectionCardContent>
          </SectionCard>
        </FormContainer>
        
        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <Button type="submit" variant="contained" color="primary" sx={{ flex: 1 }}>
              Submit
            </Button>
            <Button type="button" variant="outlined" onClick={resetForm} sx={{ flex: 1 }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </form>
      
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        PaperProps={{ style: { padding: 20, textAlign: "center" } }}
      >
        <DialogTitle id="dialog-title">{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography id="dialog-description">{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ContainerBox>
  );
}