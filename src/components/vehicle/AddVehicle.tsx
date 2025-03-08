import * as React from 'react';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid2';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from "@mui/material";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { VehicleAdd } from 'Services/vehicleService';

const FormGrid = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
}));

// Define TypeScript Interface for form data
interface VehicleFormData {
  appointmentId: string;
  chasisNumber: string;
  customerAddress: string;
  customerAadhar: string;
  customerGstin: string;
  supervisor: string;
  technician: string;
  worker: string;
  status: "In Progress" | "Complete" | "Waiting";
  date: string;
}

export default function AddVehicle() {
  const [formData, setFormData] = React.useState<VehicleFormData>({
    appointmentId: "",
    chasisNumber: "",
    customerAddress: "",
    customerAadhar: "",
    customerGstin: "",
    supervisor: "",
    technician: "",
    worker: "",
    status: "In Progress",
    date: "",
  });

  const navigate = useNavigate();

  // Handle input change
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  // Handle select change
  const handleSelectChange = (event: SelectChangeEvent<"In Progress" | "Complete" | "Waiting">) => {
    setFormData({ ...formData, status: event.target.value as VehicleFormData["status"] });
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await VehicleAdd(formData);
      console.log("Vehicle added successfully:", response.data);
      alert("Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Failed to add vehicle!");
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      width: '100%',
      maxWidth: { sm: '100%', md: '90%' },
      maxHeight: '720px',
      gap: { xs: 2, md: 'none' },
    }}>
   
   <Stack direction="row" alignItems="center" justifyContent="space-between" >
        {/* Left Side: Title */}
        <Typography component="h2" variant="h6">
            Vehicle Registration
        </Typography>

        {/* Right Side: Add Vehicle Button */}
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
            Back
        </Button>
        </Stack>

      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
         </Grid>
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <FormGrid size={{ xs: 12, md: 6 }}>
          <FormLabel htmlFor="appointmentId">Appointment ID</FormLabel>
          <OutlinedInput
            id="appointmentId"
            name="appointmentId"
            value={formData.appointmentId}
            onChange={handleChange}
            placeholder="Enter Appointment ID"
            required
            size="small"
          />
        </FormGrid>

        <FormGrid size={{ xs: 12, md: 6 }}>
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

        <FormGrid size={{ xs: 12 }}>
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

        <FormGrid size={{ xs: 12 }}>
          <FormLabel htmlFor="customerAadhar">Customer Aadhar Number</FormLabel>
          <OutlinedInput
            id="customerAadhar"
            name="customerAadhar"
            value={formData.customerAadhar}
            onChange={handleChange}
            placeholder="Enter Aadhar Number"
            required
            size="small"
          />
        </FormGrid>

         <FormGrid size={{ xs: 6 }}>
          <FormLabel htmlFor="customerGstin">Customer GSTIN</FormLabel>
          <OutlinedInput
            id="customerGstin"
            name="customerGstin"
            value={formData.customerGstin}
            onChange={handleChange}
            placeholder="Enter GSTIN"
            required
            size="small"
          />
        </FormGrid>

         <FormGrid size={{ xs: 6 }}>
          <FormLabel htmlFor="supervisor">Supervisor</FormLabel>
          <OutlinedInput
            id="supervisor"
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
            placeholder="Enter Supervisor Name"
            required
            size="small"
          />
        </FormGrid>

         <FormGrid size={{ xs: 6 }}>
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

         <FormGrid size={{ xs: 6 }}>
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

         <FormGrid size={{ xs: 6 }}>
          <FormControl size="small">
            <InputLabel >Status</InputLabel>
            <Select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              required
            >
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Complete">Complete</MenuItem>
              <MenuItem value="Waiting">Waiting</MenuItem>
            </Select>
          </FormControl>
        </FormGrid>

         <FormGrid size={{ xs: 6 }}>
          <FormLabel htmlFor="date">Date</FormLabel>
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

        <FormGrid size={{ xs: 12 }}>
          <Button type="submit" variant="contained" color="primary">
            Add Vehicle
          </Button>
        </FormGrid>
      </Grid>
    </form>
    </Box>
  );
}
