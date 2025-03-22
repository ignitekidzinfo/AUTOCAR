import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import Copyright from 'internals/components/Copyright';
import { Button, FormControl, IconButton,  InputLabel,  MenuItem,  OutlinedInput, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {  GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { GetVehicleByAppointmentID, GetVehicleByDateRange, GetVehicleByStatus, VehicleDataByID, VehicleListData } from 'Services/vehicleService';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildIcon from "@mui/icons-material/Build";
// import VehicleDeleteModal from './VehicleDeleteModal';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import InputAdornment from '@mui/material/InputAdornment';
import  { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { SingleInputDateRangeField } from '@mui/x-date-pickers-pro/SingleInputDateRangeField';
import PreviewIcon from "@mui/icons-material/Preview";
import { Print } from '@mui/icons-material';
import { filter } from 'types/SparePart';
import VehicleDeleteModal from 'components/vehicle/VehicleDeleteModal';

interface Vehicle {
    vehicleRegId: string;
    appointmentId: string;
    chasisNumber: string;
    customerAddress: string;
    customerAadharNo: string;
    customerGstin: string;
    superwiser: string;
    technician: string;
    worker: string;
    userId: string;
    status: string;
    date: string;
}

export default function StockList() {
    const navigate = useNavigate();
    const [rows, setRows] = React.useState<GridRowsProp>([]);
    const [open, setOpen] = React.useState<boolean>(false);
    const [selectedId, setSelectedId]  = React.useState<number>();
    const [dateValue ,setDateValue] =  React.useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [selectedType, setSelectedType] = React.useState<string>("");
    const [textInput, setTextInput] = React.useState<string>("");
    const [selectedStatus, setSelectedStatus] = React.useState<string>("");

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setOpen(true);
  };

  const handleSearch = async () => {
    let requestData: filter = {};
    let response;

    try {
    if (selectedType === "Vehicle ID") {
        requestData = { vehicleRegId: textInput };
        response = await VehicleDataByID(textInput);
    } else if (selectedType === "Date Range") {
        requestData = { startDate:String( dateValue[0]?.format("YYYY-MM-DD")), endDate: String( dateValue[1]?.format("YYYY-MM-DD")) };
        response = await GetVehicleByDateRange(requestData);
    } else if (selectedType === "Status") {
        requestData = { status: selectedStatus };
        const responseData = await GetVehicleByStatus(requestData);
        response = responseData.data;
    } else if (selectedType === "Appointment Number") {
        requestData = { appointmentId: textInput };
        const responseData  = await GetVehicleByAppointmentID(requestData);
        response = responseData.data;
    }
        console.log("check",response);
        if (response && Array.isArray(response)) {
         
          const formattedRows = response.map((vehicle: Vehicle, index: number) => ({
              id: index + 1, 
              vehicleRegId: vehicle.vehicleRegId,
              appointmentId: vehicle.appointmentId,
              chasisNumber: vehicle.chasisNumber,
              customerAddress: vehicle.customerAddress,
              customerAadharNo: vehicle.customerAadharNo,
              customerGstin: vehicle.customerGstin,
              superwiser: vehicle.superwiser,
              technician: vehicle.technician,
              worker: vehicle.worker,
              userId: vehicle.userId,
              Status: vehicle.status,
              date: vehicle.date,
              Action: 'View',
          }));
          setRows(formattedRows);
      } else if (response && typeof response === "object" && !Array.isArray(response) ) {
         
          const formattedRows = [
              {
                  id: 1, 
                  vehicleRegId: response.vehicleRegId,
                  appointmentId: response.appointmentId,
                  chasisNumber: response.chasisNumber,
                  customerAddress: response.customerAddress,
                  customerAadharNo: response.customerAadharNo,
                  customerGstin: response.customerGstin,
                  superwiser: response.superwiser,
                  technician: response.technician,
                  worker: response.worker,
                  userId: response.userId,
                  Status: response.status,
                  date: response.date,
                  Action: 'View',
              },
          ];
          setRows(formattedRows);
      } else {
          
          setRows([]);
      }
      

        console.log("API Response:", response);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

  function renderActionButtons(params: GridCellParams) {
    return (
      <>
        <IconButton color="primary" onClick={() => navigate(`/admin/vehicle/edit/${params.row.vehicleRegId}`)}>
          <EditIcon />
        </IconButton>
        <IconButton color="secondary" onClick={() => handleDelete(params.row.vehicleRegId as number)}>
          <DeleteIcon />
        </IconButton>
        <IconButton color="secondary" onClick={() => navigate(`/admin/vehicle/add/servicepart/${params.row.vehicleRegId}`)}>
          <BuildIcon />
        </IconButton>
        <IconButton color="secondary" onClick={() => navigate(`/admin/vehicle/view/${params.row.vehicleRegId}`)}>
          <PreviewIcon />
        </IconButton>
        <IconButton color="secondary" onClick={() => navigate(`/admin/vehicle/view/${params.row.vehicleRegId}`)}>
          <Print />
        </IconButton>
        
      </>
    );
  }
    const columns: GridColDef[] = [
      { field: 'vehicleRegId', headerName: 'Vehicle Reg ID', flex: 1, minWidth: 120 },
      {
        field: 'chasisNumber',
        headerName: 'Chasis Number',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'customerAddress',
        headerName: 'Customer Address',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'customerAadharNo',
        headerName: 'Customer Aadhar No',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'customerGstin',
        headerName: 'Customer GSTIN',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 150,
      },{
        field: 'superwiser',
        headerName: 'Superwiser',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 100,
      },{
        field: 'technician',
        headerName: 'Technician',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 100,
      },{
        field: 'worker',
        headerName: 'worker',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 100,
      },{
        field: 'Status',
        headerName: 'Status',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 100,
      },{
        field: 'date',
        headerName: 'Date',
        headerAlign: 'left',
        align: 'left',
        flex: 1,
        minWidth: 100,
      },{
        field: "Action",
        headerName: "Action",
        flex: 1,
        minWidth: 250,
        renderCell: (params) => renderActionButtons(params),
      },
      
    ];

    React.useEffect(() => {
        const getVehicleList = async () => {
            try {
                const response = await VehicleListData();
                if (response && Array.isArray(response.data)) {
                    const formattedRows = response.data.map((vehicle: Vehicle, index: number) => ({
                        id: index + 1, 
                        vehicleRegId: vehicle.vehicleRegId,
                        appointmentId: vehicle.appointmentId,
                        chasisNumber: vehicle.chasisNumber,
                        customerAddress: vehicle.customerAddress,
                        customerAadharNo: vehicle.customerAadharNo,
                        customerGstin: vehicle.customerGstin,
                        superwiser: vehicle.superwiser,
                        technician: vehicle.technician,
                        worker: vehicle.worker,
                        userId: vehicle.userId,
                        Status: vehicle.status,
                        date: vehicle.date,
                        Action: 'View', 
                    }));
                    setRows(formattedRows);
                }
            } catch (error) {
                console.error('Error fetching vehicle data:', error);
            }
        };
        getVehicleList();
    }, []);
    

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
   
   <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      
        <Typography component="h2" variant="h6">
            Vehicle List
        </Typography>

        <Button variant="contained" color="primary" onClick={() => navigate("/admin/vehicle/add")}>
            Add Vehicle
        </Button>
        </Stack>

      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        <Grid size={{ xs: 12, sm: 12, md:12, lg: 12 }} container spacing={2} sx={{ display: 'flex', gap: 2 }}  >
        <FormControl sx={{ width: { xs: "100%", md: "25ch" } }}>
        <InputLabel>Select Type</InputLabel>
        <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} size="medium">
          <MenuItem value="Vehicle ID">Vehicle ID</MenuItem>
          <MenuItem value="Date Range">Date Range</MenuItem>
          <MenuItem value="Status">Status</MenuItem>
          <MenuItem value="Appointment Number">Appointment Number</MenuItem>
        </Select>
      </FormControl>

      {selectedType === "Vehicle ID" || selectedType === "Appointment Number" ? (
        <FormControl sx={{ width: { xs: "100%", md: "25ch" } }} variant="outlined">
          <OutlinedInput
            size="small"
            id="search"
            placeholder="Enter text..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            startAdornment={
              <InputAdornment position="start" sx={{ color: "text.primary" }}>
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
          />
        </FormControl>
      ) : null}

      {selectedType === "Date Range" && (
        <Grid mt={-1}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={["SingleInputDateRangeField"]} >
            <DateRangePicker
              slots={{ field: SingleInputDateRangeField }}
              name="allowedRange"
              value={dateValue}
              onChange={(newValue) => setDateValue(newValue)}
              format="DD/MM/YYYY"
            />
          </DemoContainer>
        </LocalizationProvider>
        </Grid>
      )}

      {selectedType === "Status" && (
        <FormControl sx={{ width: { xs: "100%", md: "25ch" } }}>
          <InputLabel>Select Status</InputLabel>
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} size="medium">
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Waiting">Waiting</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>
      )}

      <Button variant="contained" color="primary" sx={{ alignSelf: "start" }} onClick={handleSearch}>
        Search
      </Button>
        </Grid>
       
          <VehicleDeleteModal open={open} onClose={() => setOpen(false)} deleteItemId={selectedId} />
      </Grid>
      
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <CustomizedDataGrid columns ={columns} rows={rows}/>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
