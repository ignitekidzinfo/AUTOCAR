import * as React from 'react';
import Grid from '@mui/material/Grid';
import { styled, useTheme, alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  Paper,
  CircularProgress,
  IconButton,
  Tooltip 
} from "@mui/material";
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleDataByID } from 'Services/vehicleService';
import { GridRowsProp, GridColDef } from '@mui/x-data-grid';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import apiClient from 'Services/apiService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import SpeedIcon from '@mui/icons-material/Speed';
import PaymentsIcon from '@mui/icons-material/Payments';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const InfoItem = styled(Box)(({ theme }) => ({
    display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(2),
  width: "100%",
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.5),
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: '1rem',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.1rem',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(1),
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface VehicleFormData {
    vehicleRegId?: string;
    appointmentId: string;
    vehicleNumber: string;
    vehicleBrand: string;
    vehicleModelName: string;
    vehicleVariant: string;
    engineNumber: string;
    chasisNumber: string;
    numberPlateColour: string;
    customerId: string;
    customerName: string;
    customerAddress: string;
    customerMobileNumber: string;
    customerAadharNo: string;
    customerGstin: string;
    superwiser: string;
    technician: string;
    worker: string;
    status: "In Progress" | "Complete" | "Waiting";
    userId: string;
    date: string;
    insuranceStatus: "Insured" | "Expired";
    insuranceFrom: string;
    insuranceTo: string;
    vehicleInspection: string;
    kmsDriven: number;
    advancePayment: number;
    manufactureYear: string;
}

export default function VehicleDetailsView() {
    const { id } = useParams();
    const theme = useTheme();
    const [loading, setLoading] = React.useState(true);
    const [formData, setFormData] = React.useState<VehicleFormData>({
        vehicleRegId: "",
        appointmentId: "",
        vehicleNumber: "",
        vehicleBrand: "",
        vehicleModelName: "",
        vehicleVariant: "",
        engineNumber: "",
        chasisNumber: "",
        numberPlateColour: "",
        customerId: "",
        customerName: "",
        customerAddress: "",
        customerMobileNumber: "",
        customerAadharNo: "",
        customerGstin: "",
        superwiser: "",
        technician: "",
        worker: "",
        status: "In Progress",
        userId: "",
        date: "",
        insuranceStatus: "Expired",
        insuranceFrom: "",
        insuranceTo: "",
        vehicleInspection: "",
        kmsDriven: 0,
        advancePayment: 0,
        manufactureYear: "",
    });

    const navigate = useNavigate();
    const [rows, setRows] = React.useState<GridRowsProp>([]);
    const [partsLoading, setPartsLoading] = React.useState(true);

    React.useEffect(() => {
        if (id) {
            fetchSpartPartList();
        }
    }, [id]);

    const fetchSpartPartList = async () => {
        try {
            setPartsLoading(true);
            const responsePart = await apiClient.get(
                `/sparePartTransactions/vehicleRegId?vehicleRegId=${id}`
            );

            if (!responsePart.data || responsePart.data.length === 0) {
                console.warn("No transactions found for this vehicleRegId");
                setPartsLoading(false);
                return;
            }

            const transactions: any = Array.isArray(responsePart.data)
                ? responsePart.data
                : [responsePart.data];
            console.log(transactions[0].data);
            const transactionsData = transactions[0].data;
            const newTransactions = transactionsData.map((resData: any, index: number) => ({
                id: index + 1, 
                partNumber: resData.partNumber,
                partName: resData.partName,
                quantity: resData.quantity,
                amount: resData.price,
                total: resData.price * resData.quantity,
                transactionType: resData.transactionType,
                vehicleRegId: resData.vehicleRegId,
                sparePartTransactionId: resData.sparePartTransactionId
            }));

            setRows([...newTransactions]);
            setPartsLoading(false);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setPartsLoading(false);
        }
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 80 },
        { field: "partNumber", headerName: "Part Number", width: 150 },
        { field: "partName", headerName: "Part Name", flex: 1, minWidth: 200 },
        { field: "quantity", headerName: "Quantity", width: 100 },
        { 
            field: "amount", 
            headerName: "Amount", 
            width: 120,
            renderCell: (params) => (
                <Typography variant="body2">₹{params.row.amount}</Typography>
            )
        },
        { 
            field: "total", 
            headerName: "Total", 
            width: 120,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight="bold">₹{params.row.total}</Typography>
            )
        },
    ];

    React.useEffect(() => {
        if (id) {
            const getVehicleData = async () => {
                setLoading(true);
                try {
                    const response = await VehicleDataByID(id);
                    setFormData({
                        vehicleRegId: response.vehicleRegId,
                        appointmentId: response.appointmentId,
                        vehicleNumber: response.vehicleNumber,
                        vehicleBrand: response.vehicleBrand,
                        vehicleModelName: response.vehicleModelName,
                        vehicleVariant: response.vehicleVariant,
                        engineNumber: response.engineNumber,
                        chasisNumber: response.chasisNumber,
                        numberPlateColour: response.numberPlateColour,
                        customerId: response.customerId,
                        customerName: response.customerName,
                        customerAddress: response.customerAddress,
                        customerMobileNumber: response.customerMobileNumber,
                        customerAadharNo: response.customerAadharNo,
                        customerGstin: response.customerGstin,
                        superwiser: response.superwiser,
                        technician: response.technician,
                        worker: response.worker,
                        status: response.status,
                        userId: response.userId,
                        date: response.date,
                        insuranceStatus: response.insuranceStatus || "Expired",
                        insuranceFrom: response.insuredFrom || "",
                        insuranceTo: response.insuredTo || "",
                        vehicleInspection: response.vehicleInspection || "",
                        kmsDriven: response.kmsDriven || 0,
                        advancePayment: response.advancePayment || 0,
                        manufactureYear: response.manufactureYear ? response.manufactureYear.toString() : "",
                    });
                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching vehicle data:", error);
                    setLoading(false);
                }
            };
            getVehicleData();
        }
    }, [id]);

    // Helper function to get status chip color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'complete':
                return 'success';
            case 'in progress':
                return 'warning';
            case 'waiting':
                return 'info';
            default:
                return 'default';
        }
    };

    // Helper function to get insurance status chip color
    const getInsuranceColor = (status: string) => {
        return status.toLowerCase() === 'insured' ? 'success' : 'error';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading vehicle details...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            p: 2,
        }}>
            {/* Header */}
            <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Box 
                    sx={{ 
                        p: 2, 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton 
                            onClick={() => navigate(-1)}
                            sx={{ 
                                backgroundColor: alpha(theme.palette.common.white, 0.8),
                                '&:hover': { backgroundColor: alpha(theme.palette.common.white, 1) }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <div>
                            <Typography variant="h5" fontWeight="bold" color="primary">
                    Vehicle Details
                </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formData.vehicleNumber} • {formData.vehicleBrand} {formData.vehicleModelName}
                            </Typography>
                        </div>
                    </Stack>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<ReceiptIcon />}
                        onClick={() => navigate(`/admin/billForm/${id}`)}
                        sx={{ borderRadius: 2 }}
                    >
                        Generate Bill
                    </Button>
                </Box>
                
                <CardContent sx={{ p: 3 }}>
                    {/* Status information */}
                    <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Chip 
                            label={`Status: ${formData.status}`} 
                            color={getStatusColor(formData.status) as any}
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Chip 
                            label={`Insurance: ${formData.insuranceStatus}`} 
                            color={getInsuranceColor(formData.insuranceStatus) as any}
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Chip 
                            label={`Admission Date: ${formData.date}`} 
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Chip 
                            label={`Advance: ₹${formData.advancePayment}`} 
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>

            <Grid container spacing={3}>
                        {/* Vehicle Information Section */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                <SectionTitle>
                                    <DirectionsCarIcon color="primary" /> Vehicle Information
                                </SectionTitle>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Vehicle Number</InfoLabel>
                                            <InfoValue>{formData.vehicleNumber}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Vehicle Brand</InfoLabel>
                                            <InfoValue>{formData.vehicleBrand}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Status</InfoLabel>
                                            <InfoValue sx={{ color: getStatusColor(formData.status) as string }}>{formData.status}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Insurance Status</InfoLabel>
                                            <InfoValue sx={{ color: getInsuranceColor(formData.insuranceStatus) as string }}>{formData.insuranceStatus}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Admission Date</InfoLabel>
                                            <InfoValue>{formData.date}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Advance Payment</InfoLabel>
                                            <InfoValue>₹{formData.advancePayment}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Model Name</InfoLabel>
                                            <InfoValue>{formData.vehicleModelName}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Fuel Type</InfoLabel>
                                            <InfoValue>{formData.vehicleVariant}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Engine Number</InfoLabel>
                                            <InfoValue>{formData.engineNumber}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Chasis Number</InfoLabel>
                                            <InfoValue>{formData.chasisNumber}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Number Plate Color</InfoLabel>
                                            <InfoValue>{formData.numberPlateColour}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Manufacture Year</InfoLabel>
                                            <InfoValue>{formData.manufactureYear}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Kilometers Driven</InfoLabel>
                                            <InfoValue>{formData.kmsDriven} km</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Customer Information Section */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                                <SectionTitle>
                                    <PersonIcon color="info" /> Customer Information
                                </SectionTitle>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Customer Name</InfoLabel>
                                            <InfoValue>{formData.customerName}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Mobile Number</InfoLabel>
                                            <InfoValue>{formData.customerMobileNumber}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <InfoItem>
                                            <InfoLabel>Customer Address</InfoLabel>
                                            <InfoValue>{formData.customerAddress}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Aadhar Number</InfoLabel>
                                            <InfoValue>{formData.customerAadharNo}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>GSTIN</InfoLabel>
                                            <InfoValue>{formData.customerGstin}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Service Information Section */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.03) }}>
                                <SectionTitle>
                                    <BuildIcon color="secondary" /> Service Information
                                </SectionTitle>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Supervisor</InfoLabel>
                                            <InfoValue>{formData.superwiser}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Technician</InfoLabel>
                                            <InfoValue>{formData.technician}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Worker</InfoLabel>
                                            <InfoValue>{formData.worker}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Vehicle Inspection</InfoLabel>
                                            <InfoValue>{formData.vehicleInspection}</InfoValue>
                                        </InfoItem>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Insurance Information Section */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.03) }}>
                                <SectionTitle>
                                    <VerifiedUserIcon color="success" /> Insurance Information
                                </SectionTitle>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <InfoItem>
                                            <InfoLabel>Insurance Status</InfoLabel>
                                            <InfoValue>
                                                <Chip 
                                                    label={formData.insuranceStatus} 
                                                    color={getInsuranceColor(formData.insuranceStatus) as any}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </InfoValue>
                                        </InfoItem>
                                    </Grid>
                {formData.insuranceStatus === "Insured" && (
                    <>
                                            <Grid item xs={12} md={6}>
                                                <InfoItem>
                                                    <InfoLabel>Insurance From</InfoLabel>
                                                    <InfoValue>{formData.insuranceFrom}</InfoValue>
                                                </InfoItem>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <InfoItem>
                                                    <InfoLabel>Insurance To</InfoLabel>
                                                    <InfoValue>{formData.insuranceTo}</InfoValue>
                                                </InfoItem>
                                            </Grid>
                    </>
                )}
                                </Grid>
                            </Paper>
                        </Grid>
            </Grid>
                </CardContent>
            </Card>

            {/* Service Parts Card */}
            <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box 
                    sx={{ 
                        p: 2, 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        background: `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                    }}
                >
                    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon color="warning" /> Service Part Details
                </Typography>
                </Box>
                
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                        position: 'relative',
                        height: '400px',
                        overflow: 'hidden',
                    }}>
                        {partsLoading ? (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%', 
                                width: '100%'
                            }}>
                                <CircularProgress size={30} />
                                <Typography variant="body2" sx={{ ml: 2 }}>Loading service parts...</Typography>
                            </Box>
                        ) : rows.length === 0 ? (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100%', 
                                width: '100%',
                                color: 'text.secondary',
                                flexDirection: 'column',
                                p: 4
                            }}>
                                <BuildIcon sx={{ fontSize: 40, mb: 2, opacity: 0.3 }} />
                                <Typography>No service parts found for this vehicle</Typography>
                            </Box>
                        ) : (
                            <CustomizedDataGrid 
                                columns={columns} 
                                rows={rows} 
                                checkboxSelection={false} 
                            />
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}