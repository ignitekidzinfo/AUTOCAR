import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// import Copyright from '../internals/components/Copyright';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GarageIcon from '@mui/icons-material/Garage';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import Copyright from 'internals/components/Copyright';
import { Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {  GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import { VehicleListData } from 'Services/vehicleService';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


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



export default function VehicleList() {
    const navigate = useNavigate();
    const [rows, setRows] = React.useState<GridRowsProp>([]);

    function renderStatus(status: 'Online' | 'Offline') {
      const colors: { [index: string]: 'success' | 'default' } = {
        Online: 'success',
        Offline: 'default',
      };
    
      return <Chip label={status} color={colors[status]} size="small" />;
    }

    function renderSparklineCell(params: GridCellParams<any>) {
    //   const data = getDaysInMonth(4, 2024);
    
      const { value, colDef } = params;
    
      if (!value ) {
        return null;
      }
    }

    // Function to handle Edit Click
const handleEdit = (id: number) => {
    console.log("Edit Clicked for ID:", id);
    // Navigate to edit page or open a modal
  };
  
  // Function to handle Delete Click
  const handleDelete = (id: number) => {
    console.log("Delete Clicked for ID:", id);
    // Perform delete operation
  };
  
  // Function to render Edit & Delete buttons in the "Action" column
  function renderActionButtons(params: GridCellParams<any>) {
    return (
      <>
        <IconButton color="primary" onClick={() => handleEdit(params.id as number)}>
          <EditIcon />
        </IconButton>
        <IconButton color="secondary" onClick={() => handleDelete(params.id as number)}>
          <DeleteIcon />
        </IconButton>
      </>
    );
  }
    const columns: GridColDef[] = [
      { field: 'vehicleRegId', headerName: 'Vehicle Reg ID', flex: 1, minWidth: 100 },
    //   {
    //     field: 'status',
    //     headerName: 'Status',
    //     flex: 0.5,
    //     minWidth: 80,
    //     renderCell: (params) => renderStatus(params.value as any),
    //   },
      {
        field: 'appointmentId',
        headerName: 'Appointment ID',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'chasisNumber',
        headerName: 'Chasis Number',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'customerAddress',
        headerName: 'Customer Address',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'customerAadharNo',
        headerName: 'Customer Aadhar No',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },
      {
        field: 'customerGstin',
        headerName: 'Customer GSTIN',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'superwiser',
        headerName: 'Superwiser',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'technician',
        headerName: 'Technician',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'worker',
        headerName: 'worker',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'userId',
        headerName: 'User ID',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'Status',
        headerName: 'Status',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'date',
        headerName: 'Date',
        headerAlign: 'right',
        align: 'right',
        flex: 1,
        minWidth: 100,
      },{
        field: 'Action',
        headerName: 'Action',
        // headerAlign: 'right',
        // align: 'right',
        flex: 1,
        minWidth: 100,
        renderCell: (params) => renderActionButtons(params.value as any),
      },
    ];

    React.useEffect(() => {
        const getVehicleList = async () => {
            try {
                const response = await VehicleListData();
                if (response && Array.isArray(response.data)) {
                    const formattedRows = response.data.map((vehicle: Vehicle, index: number) => ({
                        id: index + 1, // Ensure each row has a unique id
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
                        Action: 'View', // Modify as needed
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
        {/* Left Side: Title */}
        <Typography component="h2" variant="h6">
            Vehicle List
        </Typography>

        {/* Right Side: Add Vehicle Button */}
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
       
        {/* <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid> */}
        {/* <Grid size={{ xs: 12, md: 6 }}>
          <SessionsChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PageViewsBarChart />
        </Grid> */}
      </Grid>
      {/* <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Details
      </Typography> */}
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <CustomizedDataGrid columns ={columns} rows={rows}/>
        </Grid>
        {/* <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            <CustomizedTreeView />
            <ChartUserByCountry />
          </Stack>
        </Grid> */}
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
