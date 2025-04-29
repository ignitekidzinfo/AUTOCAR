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
  TextField
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

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const ContainerBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  width: '100%',
  maxWidth: '90%',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

export default function AddVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string }>({});

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
    const newErrors: { email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string } = {};
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateFields()) return;
    try {
      const { fuelType, ...rest } = formData;
      const payload = { ...rest, vehicleVariant: fuelType, status: id ? formData.status : "Waiting" };
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
            insuranceFrom: response.insuranceFrom || "",
            insuranceTo: response.insuranceTo || "",
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
          {id ? "Update " : "Add "}Vehicle Registration
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
          <TextField {...params} label="Search Vehicle Registration (by Vehicle Number)" variant="outlined" fullWidth margin="normal" />
        )}
      />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="vehicleNumber">Vehicle Number</FormLabel>
            <OutlinedInput
              id="vehicleNumber"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Number"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="fuelType">Fuel Type</FormLabel>
            <FormControl fullWidth size="small">
              <InputLabel id="fuelType-label">Fuel Type</InputLabel>
              <Select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleFuelTypeChange}
                label="Fuel Type"
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
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="manufactureYear">Manufacture Year</FormLabel>
            <OutlinedInput
              id="manufactureYear"
              name="manufactureYear"
              value={formData.manufactureYear}
              onChange={handleChange}
              placeholder="YYYY"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="kmsDriven">Kilometer Driven</FormLabel>
            <OutlinedInput
              id="kmsDriven"
              name="kmsDriven"
              value={formData.kmsDriven}
              onChange={handleChange}
              placeholder="Enter Kilometer Driven"
              required
              size="small"
              error={Boolean(errors.kmsDriven)}
            />
            {errors.kmsDriven && <FormHelperText error>{errors.kmsDriven}</FormHelperText>}
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="date">Date Of Admission</FormLabel>
            <OutlinedInput
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="chasisNumber">Chasis Number</FormLabel>
            <OutlinedInput
              id="chasisNumber"
              name="chasisNumber"
              value={formData.chasisNumber}
              onChange={handleChange}
              placeholder="Enter Chasis Number"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12}>
            <FormLabel htmlFor="customerAddress">Customer Address</FormLabel>
            <OutlinedInput
              id="customerAddress"
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleChange}
              placeholder="Enter Customer Address"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="customerMobileNumber">Mobile Number</FormLabel>
            <OutlinedInput
              id="customerMobileNumber"
              name="customerMobileNumber"
              value={formData.customerMobileNumber}
              onChange={handleChange}
              placeholder="Enter Mobile Number"
              required
              size="small"
              error={Boolean(errors.customerMobileNumber)}
            />
            {errors.customerMobileNumber && <FormHelperText error>{errors.customerMobileNumber}</FormHelperText>}
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="email">Email</FormLabel>
            <OutlinedInput
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              required
              size="small"
              error={Boolean(errors.email)}
            />
            {errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="customerAadharNo">Customer Aadhaar No</FormLabel>
            <OutlinedInput
              id="customerAadharNo"
              name="customerAadharNo"
              value={formData.customerAadharNo}
              onChange={handleChange}
              placeholder="Enter Customer Aadhaar No"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="customerGstin">Customer GSTIN</FormLabel>
            <OutlinedInput
              id="customerGstin"
              name="customerGstin"
              value={formData.customerGstin}
              onChange={handleChange}
              placeholder="Enter Customer GSTIN"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="vehicleBrand">Vehicle Brand</FormLabel>
            <OutlinedInput
              id="vehicleBrand"
              name="vehicleBrand"
              value={formData.vehicleBrand}
              onChange={handleChange}
              placeholder="Enter Vehicle Brand"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="vehicleModelName">Model Name</FormLabel>
            <OutlinedInput
              id="vehicleModelName"
              name="vehicleModelName"
              value={formData.vehicleModelName}
              onChange={handleChange}
              placeholder="Enter Model Name"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="engineNumber">Engine Number</FormLabel>
            <OutlinedInput
              id="engineNumber"
              name="engineNumber"
              value={formData.engineNumber}
              onChange={handleChange}
              placeholder="Enter Engine Number"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="numberPlateColour">Number Plate Color</FormLabel>
            <OutlinedInput
              id="numberPlateColour"
              name="numberPlateColour"
              value={formData.numberPlateColour}
              onChange={handleChange}
              placeholder="Enter Number Plate Color"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="customerName">Customer Name</FormLabel>
            <OutlinedInput
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter Customer Name"
              required
              size="small"
              error={Boolean(errors.customerName)}
            />
            {errors.customerName && <FormHelperText error>{errors.customerName}</FormHelperText>}
          </FormGrid>
          {id && (
            <FormGrid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={handleSelectChange} required>
                  <MenuItem value="Waiting">Waiting</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Complete">Complete</MenuItem>
                </Select>
              </FormControl>
            </FormGrid>
          )}
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="superwiser">Supervisor</FormLabel>
            <OutlinedInput
              id="superwiser"
              name="superwiser"
              value={formData.superwiser}
              onChange={handleChange}
              placeholder="Enter Supervisor Name"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="technician">Technician</FormLabel>
            <OutlinedInput
              id="technician"
              name="technician"
              value={formData.technician}
              onChange={handleChange}
              placeholder="Enter Technician Name"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="worker">Worker</FormLabel>
            <OutlinedInput
              id="worker"
              name="worker"
              value={formData.worker}
              onChange={handleChange}
              placeholder="Enter Worker Name"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="vehicleInspection">Vehicle Inspection</FormLabel>
            <OutlinedInput
              id="vehicleInspection"
              name="vehicleInspection"
              value={formData.vehicleInspection}
              onChange={handleChange}
              placeholder="Enter Vehicle Inspection details"
              required
              size="small"
            />
          </FormGrid>
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="insuranceStatus">Insurance Status</FormLabel>
            <FormControl fullWidth size="small">
              <Select id="insuranceStatus" name="insuranceStatus" value={formData.insuranceStatus} onChange={handleInsuranceStatusChange} required>
                <MenuItem value="Insured">Insured</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </FormGrid>
          {formData.insuranceStatus === "Insured" && (
            <>
              <FormGrid item xs={12} md={6}>
                <FormLabel htmlFor="insuranceFrom">Insurance From</FormLabel>
                <OutlinedInput id="insuranceFrom" name="insuranceFrom" type="date" value={formData.insuranceFrom} onChange={handleChange} required={!id} size="small" />
              </FormGrid>
              <FormGrid item xs={12} md={6}>
                <FormLabel htmlFor="insuranceTo">Insurance To</FormLabel>
                <OutlinedInput id="insuranceTo" name="insuranceTo" type="date" value={formData.insuranceTo} onChange={handleChange} required={!id} size="small" />
              </FormGrid>
            </>
          )}
          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="advancePayment">Advance Payment</FormLabel>
            <OutlinedInput id="advancePayment" name="advancePayment" type="number" value={formData.advancePayment} onChange={handleChange} placeholder="Enter Advance Payment" size="small" />
          </FormGrid>
          <FormGrid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              {id ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </FormGrid>
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