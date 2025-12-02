import React, { useState, useEffect, useCallback, useRef, RefObject } from 'react';
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
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import { SelectChangeEvent } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleAdd, VehicleDataByID, VehicleUpdate } from 'Services/vehicleService';
import apiClient from 'Services/apiService';
import CircularProgress from '@mui/material/CircularProgress';

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
  fuelType: string;
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
  variant: string;
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
  variant: "",
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
    fontWeight: 700
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

// Add styled FormLabel component
const BoldFormLabel = styled(FormLabel)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5)
}));

export default function AddVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Add refs for fields with potential errors
  const kmsDrivenRef = useRef<HTMLDivElement>(null);
  const customerNameRef = useRef<HTMLDivElement>(null);
  const customerMobileRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const insuranceToRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [errors, setErrors] = useState<{ email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string; insuranceTo?: string; manufactureYear?: string }>({});

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<VehicleRegDto[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRegDto | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const [showYearHint, setShowYearHint] = useState(false);

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
    const newErrors: { email?: string; customerName?: string; customerMobileNumber?: string; kmsDriven?: string; insuranceTo?: string; manufactureYear?: string } = {};
    // Manufacture year: must be a 4-digit year like 2019
    if (formData.manufactureYear && String(formData.manufactureYear).trim() !== '') {
      const yearStr = String(formData.manufactureYear).trim();
      const yearRegex = /^(19\d{2}|20\d{2})$/; // years 1900-2099
      if (!yearRegex.test(yearStr)) {
        newErrors.manufactureYear = 'Enter a valid 4-digit year (e.g., 2019)';
      }
    }
    type DivRef = typeof kmsDrivenRef;
    let firstErrorRef: DivRef | null = null;

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
      firstErrorRef = customerNameRef;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      if (!firstErrorRef) firstErrorRef = emailRef;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
        if (!firstErrorRef) firstErrorRef = emailRef;
      }
    }

    if (!formData.customerMobileNumber.trim()) {
      newErrors.customerMobileNumber = "Mobile number is required";
      if (!firstErrorRef) firstErrorRef = customerMobileRef;
    } else {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(formData.customerMobileNumber)) {
        newErrors.customerMobileNumber = "Mobile number must be exactly 10 digits";
        if (!firstErrorRef) firstErrorRef = customerMobileRef;
      }
    }

    if (!formData.kmsDriven || formData.kmsDriven.toString().trim() === "" || Number(formData.kmsDriven) === 0) {
      newErrors.kmsDriven = "Kilometer Driven is required";
      if (!firstErrorRef) firstErrorRef = kmsDrivenRef;
    }

    if (formData.insuranceStatus === "Expired" && !formData.insuranceTo) {
      newErrors.insuranceTo = "Expired At date is required";
      if (!firstErrorRef) firstErrorRef = insuranceToRef;
    }

    setErrors(newErrors);

    // Scroll to the first error field if any
    if (firstErrorRef && firstErrorRef.current) {
      const ref = firstErrorRef; // Create a non-null reference to use inside the timeout
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateFields()) return;

    setIsSubmitting(true);

    if (!id) {
      setProcessingDialogOpen(true);
    }

    try {
      const { variant, fuelType, insuranceFrom, insuranceTo, ...restData } = formData;

      let payload = {
        ...restData,
        vehicleVariant: variant || "",
        fuelType: fuelType || "",
        status: id ? formData.status : "Waiting",
        insuredFrom: insuranceFrom || null,
        insuredTo: insuranceTo || null
      };
      if (!id) {
        payload = {
          ...payload,
          vehicleRegId: '',
          appointmentId: '',
          customerId: '',
          userId: '',
        };
      }

      if (id) {
        const response = await VehicleUpdate(payload);
        setDialogTitle("Success");
        setDialogMessage("Vehicle updated successfully!");
        setDialogOpen(true);
        setIsSubmitting(false);
      } else {
        const tempId = "pending-" + Date.now();

        sessionStorage.setItem('pendingVehicleData', JSON.stringify(payload));
        sessionStorage.setItem('pendingVehicleId', tempId);

        setTimeout(() => {
          setProcessingDialogOpen(false);
          resetForm();
          navigate(`/admin/vehicle/add/servicepart/${tempId}`, {
            state: {
              isPending: true,
              pendingVehicleData: payload
            }
          });
        }, 1500);

        VehicleAdd(payload).then(response => {
          const generatedId = response.data.vehicleRegId;

          sessionStorage.setItem('realVehicleId', generatedId);
          sessionStorage.setItem('pendingVehicleId', '');

        }).catch(error => {
          sessionStorage.setItem('vehicleAddError', error?.message || 'Unknown error');

        });
      }
    } catch (error: any) {
      let errorMsg = "Failed to process vehicle.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setDialogTitle("Error");
      setDialogMessage(errorMsg);
      setDialogOpen(true);
      setProcessingDialogOpen(false);
      setIsSubmitting(false);
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
            vehicleInspection: '',
            kmsDriven: response.kmsDriven || "",
            status: response.status || "Waiting",
            userId: response.userId || "",
            date: response.date || "",
            insuranceStatus: response.insuranceStatus || "Expired",
            insuranceFrom: response.insuredFrom || "",
            insuranceTo: response.insuredTo || "",
            fuelType: response.fuelType || "",
            variant: response.vehicleVariant || "",
            manufactureYear: response.manufactureYear ? String(response.manufactureYear) : "",
            advancePayment: response.advancePayment || 0,
          });
        } catch (error) {
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
      }
    };
    fetchSearchResults();
  }, [searchInput]);
  const handleVehicleSelect = async (event: any, value: VehicleRegDto | null) => {
    setSelectedVehicle(value);
    if (value && value.vehicleRegId) {
      setLoadingVehicle(true);
      try {
        const response = await VehicleDataByID(value.vehicleRegId);
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
          superwiser: '',
          technician: '',
          worker: '',
          vehicleInspection: '',
          kmsDriven: "",
          status: response.status || "Waiting",
          userId: response.userId || "",
          date: response.date || "",
          insuranceStatus: response.insuranceStatus || "Expired",
          insuranceFrom: response.insuredFrom || "",
          insuranceTo: response.insuredTo || "",
          fuelType: response.fuelType || "",
          variant: response.vehicleVariant || "",
          manufactureYear: response.manufactureYear ? String(response.manufactureYear) : "",
          advancePayment: response.advancePayment || 0,
        });
      } catch (error) {
      } finally {
        setLoadingVehicle(false);
      }
    } else {
      setFormData(initialFormData);
    }
  };

  return (
    <ContainerBox>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography component="h2" variant="h6" fontWeight="bold">
          {id ? "Update " : "Add New "}Vehicle
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <form onSubmit={handleSubmit}>
        <FormContainer container>
          <SectionCard>
            <SectionCardHeader title="Vehicle Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormGrid>
                    <BoldFormLabel htmlFor="vehicleNumber">Vehicle No*</BoldFormLabel>
                    <Autocomplete
                      freeSolo
                      options={searchResults}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.vehicleNumber}
                      value={selectedVehicle || formData.vehicleNumber || ''}
                      onChange={(event, value) => {
                        if (typeof value === 'string') {
                          setFormData({ ...formData, vehicleNumber: value });
                          setSelectedVehicle(null);
                        } else if (value && value.vehicleRegId) {
                          setSelectedVehicle(value);
                          setFormData({
                            vehicleRegId: value.vehicleRegId || "",
                            appointmentId: value.appointmentId || "",
                            vehicleNumber: value.vehicleNumber || "",
                            vehicleBrand: value.vehicleBrand || "",
                            vehicleModelName: value.vehicleModelName || "",
                            engineNumber: value.engineNumber || "",
                            chasisNumber: value.chasisNumber || "",
                            numberPlateColour: value.numberPlateColour || "",
                            customerId: value.customerId || "",
                            customerName: value.customerName || "",
                            customerAddress: value.customerAddress || "",
                            customerMobileNumber: value.customerMobileNumber || "",
                            customerAadharNo: value.customerAadharNo || "",
                            customerGstin: value.customerGstin || "",
                            email: value.email || "",
                            superwiser: '',
                            technician: '',
                            worker: '',
                            vehicleInspection: '',
                            kmsDriven: "",
                            status: value.status || "Waiting",
                            userId: value.userId || "",
                            date: value.date || "",
                            insuranceStatus: value.insuranceStatus || "Expired",
                            insuranceFrom: value.insuranceFrom || "",
                            insuranceTo: value.insuranceTo || "",
                            fuelType: value.fuelType || "",
                            variant: value.vehicleVariant || "",
                            manufactureYear: value.manufactureYear ? String(value.manufactureYear) : "",
                            advancePayment: value.advancePayment || 0,
                          });
                        } else {
                          setFormData({ ...formData, vehicleNumber: '' });
                          setSelectedVehicle(null);
                        }
                      }}
                      onInputChange={(event, newInputValue) => {
                        setSearchInput(newInputValue);
                        setFormData({ ...formData, vehicleNumber: newInputValue });
                      }}
                      filterOptions={(options) => options}
                      renderOption={(props, option) => (
                        <li {...props} key={typeof option === 'string' ? option : option.vehicleRegId}>
                          {typeof option === 'string' ? option : option.vehicleNumber}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} label="Vehicle No*" variant="outlined" required size="small" fullWidth />
                      )}
                    />
                  </FormGrid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormGrid>
                    <BoldFormLabel htmlFor="numberPlateColour">Number Plate Colour*</BoldFormLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        id="numberPlateColour"
                        name="numberPlateColour"
                        value={formData.numberPlateColour}
                        onChange={(e: SelectChangeEvent) => setFormData({ ...formData, numberPlateColour: e.target.value })}
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="vehicleBrand">Vehicle Maker*</BoldFormLabel>
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="engineNumber">Engine Number</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="vehicleModelName">Model Line*</BoldFormLabel>
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="vehicleInspection">Sitting Capacity</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="variant">Variant*</BoldFormLabel>
                    <OutlinedInput
                      id="variant"
                      name="variant"
                      value={formData.variant}
                      onChange={handleChange}
                      placeholder="Enter/Select Vehicle Variant"
                      required
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>

                <Grid item xs={12} sm={6}>

                  <FormGrid>
                    <BoldFormLabel htmlFor="ccEngine">CC Engine</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="fuelType">Fuel Type*</BoldFormLabel>
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="manufactureYear">Manufactured Year</BoldFormLabel>
                    <Tooltip open={showYearHint} title="Please enter a 4-digit year (e.g., 2019)" placement="top" arrow>
                      <OutlinedInput
                        id="manufactureYear"
                        name="manufactureYear"
                        value={formData.manufactureYear}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw.replace(/[^0-9]/g, '').slice(0, 4);
                          if (raw !== val) {
                            setShowYearHint(true);
                            window.setTimeout(() => setShowYearHint(false), 1500);
                          }
                          setFormData({ ...formData, manufactureYear: val });
                          setErrors(prev => ({ ...prev, manufactureYear: '' }));
                        }}
                        placeholder="e.g., 2019"
                        size="small"
                        error={Boolean(errors.manufactureYear)}
                        fullWidth
                        inputRef={yearInputRef}
                      />
                    </Tooltip>
                    {errors.manufactureYear && <FormHelperText error>{errors.manufactureYear}</FormHelperText>}
                  </FormGrid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormGrid ref={kmsDrivenRef}>
                    <BoldFormLabel htmlFor="kmsDriven">Kilometer Driven</BoldFormLabel>
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="date">Date Of Admission</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="chasisNumber">Chasis Number</BoldFormLabel>
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

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" component="h3" sx={{ mb: 2 }} fontWeight="bold">
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
                  <Grid item xs={12} sm={6} md={4} ref={insuranceToRef}>
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

          <SectionCard>
            <SectionCardHeader title="Customer Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>

                <Grid item xs={12} sm={6} md={4}>

                  <FormGrid ref={customerNameRef}>
                    <BoldFormLabel htmlFor="customerName">Customer Name*</BoldFormLabel>
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
                  <FormGrid ref={customerMobileRef}>
                    <BoldFormLabel htmlFor="customerMobileNumber">Mobile No*</BoldFormLabel>
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

                  <FormGrid ref={emailRef}>
                    <BoldFormLabel htmlFor="email">Email Id</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="customerAddress">Customer Address*</BoldFormLabel>
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
                  <FormGrid>
                    <BoldFormLabel htmlFor="customerAadharNo">Customer Aadhar No.</BoldFormLabel>
                    <OutlinedInput
                      id="customerAadharNo"
                      name="customerAadharNo"
                      value={formData.customerAadharNo}
                      onChange={handleChange}
                      placeholder="Enter Customer Aadhar No."
                      size="small"
                      fullWidth
                    />
                  </FormGrid>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormGrid>
                    <BoldFormLabel htmlFor="customerGstin">Customer GSTIN</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="advancePayment">Advance Payment*</BoldFormLabel>
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

          <SectionCard>
            <SectionCardHeader title="Staff Details" />
            <SectionCardContent>
              <ResponsiveGrid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                <Grid item xs={12} sm={6} md={4}>

                  <FormGrid>
                    <BoldFormLabel htmlFor="superwiser">Superwiser*</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="technician">Technician*</BoldFormLabel>
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

                  <FormGrid>
                    <BoldFormLabel htmlFor="worker">Worker*</BoldFormLabel>
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
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ flex: 1 }}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? "Processing..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={resetForm}
              sx={{ flex: 1 }}
              disabled={isSubmitting}
            >
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

      <Dialog
        open={processingDialogOpen}
        aria-labelledby="processing-dialog-title"
        PaperProps={{
          style: {
            padding: 30,
            textAlign: "center",
            minWidth: '300px',
            borderRadius: '12px'
          }
        }}
        disableEscapeKeyDown
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          py: 2
        }}>
          <CircularProgress size={50} />
          <Box>
            <Typography variant="h6" gutterBottom>
              Processing Vehicle Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We're saving your data and preparing the next page...
            </Typography>
          </Box>
        </Box>
      </Dialog>

      {loadingVehicle && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <CircularProgress size={32} />
        </Box>
      )}
    </ContainerBox>
  );
}