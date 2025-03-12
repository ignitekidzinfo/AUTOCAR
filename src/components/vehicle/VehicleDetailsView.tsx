import * as React from 'react';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Box, Button } from "@mui/material";
import { useNavigate, useParams } from 'react-router-dom';
import { VehicleDataByID } from 'Services/vehicleService';
import { GridRowsProp, GridColDef } from '@mui/x-data-grid';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import apiClient from 'Services/apiService';

const FormGrid = styled(Grid)(() => ({
    display: "flex",
    flexDirection: "row",
    gap: 5,
}));

const FormGrid2 = styled(Grid)(() => ({
    display: "flex",
    flexDirection: "column",
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
    jobCard: string;
    kmsDriven: number;
}

export default function VehicleDetailsView() {
    const { id } = useParams();
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
        jobCard: "",
        kmsDriven: 0,
    });

    const navigate = useNavigate();
    const [rows, setRows] = React.useState<GridRowsProp>([]);

    React.useEffect(() => {
        if (id) {
            fetchSpartPartList();
        }
    }, [id]);

    const fetchSpartPartList = async () => {
        try {
            const responsePart = await apiClient.get(
                `/sparePartTransactions/vehicleRegId?vehicleRegId=${id}`
            );

            if (!responsePart.data || responsePart.data.length === 0) {
                console.warn("No transactions found for this vehicleRegId");
                return;
            }

            const transactions: any = Array.isArray(responsePart.data)
                ? responsePart.data
                : [responsePart.data];
            console.log(transactions[0].data);
            const transactionsData = transactions[0].data;
            const newTransactions = transactionsData.map((resData: any, index: number) => ({
                id: rows.length + index + 1, 
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
        } catch (err) {
            console.error("Error fetching transactions:", err);
        }
    };

    const columns: GridColDef[] = [
        { field: "id", flex: 1, headerName: "ID", width: 80 },
        { field: "partNumber", flex: 1, headerName: "Part Number", width: 100 },
        { field: "partName", flex: 1, headerName: "Part Name", width: 300 },
        { field: "quantity", flex: 1, headerName: "Quantity", width: 50 },
        { field: "amount", flex: 1, headerName: "Amount", width: 150 },
        { field: "total", flex: 1, headerName: "Total", width: 150 },
    ];

    React.useEffect(() => {
        if (id) {
            const getVehicleData = async () => {
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
                        insuranceFrom: response.insuranceFrom || "",
                        insuranceTo: response.insuranceTo || "",
                        vehicleInspection: response.vehicleInspection || "",
        
                        jobCard: response.jobCard || response.jobcard || "",
                        kmsDriven: response.kmsDriven || 0,
                    });
                } catch (error) {
                    console.error("Error fetching vehicle data:", error);
                }
            };
            getVehicleData();
        }
    }, [id]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            width: '100%',
            maxWidth: { sm: '100%', md: '90%' },
            maxHeight: '720px',
            gap: { xs: 2, md: 2 },
        }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography component="h2" variant="h6">
                    Vehicle Details
                </Typography>
                <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Stack>

            <Grid container spacing={3}>
              =
                <FormGrid item xs={12} md={6}>
                    <Typography>Vehicle Number :</Typography>
                    <FormLabel>{formData.vehicleNumber}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Vehicle Brand :</Typography>
                    <FormLabel>{formData.vehicleBrand}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Model Name :</Typography>
                    <FormLabel>{formData.vehicleModelName}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Variant :</Typography>
                    <FormLabel>{formData.vehicleVariant}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Engine Number :</Typography>
                    <FormLabel>{formData.engineNumber}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Number Plate Color :</Typography>
                    <FormLabel>{formData.numberPlateColour}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Customer Name :</Typography>
                    <FormLabel>{formData.customerName}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Mobile Number :</Typography>
                    <FormLabel>{formData.customerMobileNumber}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Chasis Number :</Typography>
                    <FormLabel>{formData.chasisNumber}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Customer Address :</Typography>
                    <FormLabel>{formData.customerAddress}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Aadhar Number :</Typography>
                    <FormLabel>{formData.customerAadharNo}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>GSTIN :</Typography>
                    <FormLabel>{formData.customerGstin}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Supervisor :</Typography>
                    <FormLabel>{formData.superwiser}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Technician :</Typography>
                    <FormLabel>{formData.technician}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Worker :</Typography>
                    <FormLabel>{formData.worker}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Status :</Typography>
                    <FormLabel>{formData.status}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Date :</Typography>
                    <FormLabel>{formData.date}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>Insurance Status :</Typography>
                    <FormLabel>{formData.insuranceStatus}</FormLabel>
                </FormGrid>
                {formData.insuranceStatus === "Insured" && (
                    <>
                        <FormGrid item xs={12} md={6}>
                            <Typography>Insurance From :</Typography>
                            <FormLabel>{formData.insuranceFrom}</FormLabel>
                        </FormGrid>
                        <FormGrid item xs={12} md={6}>
                            <Typography>Insurance To :</Typography>
                            <FormLabel>{formData.insuranceTo}</FormLabel>
                        </FormGrid>
                    </>
                )}

                <FormGrid item xs={12} md={6}>
                    <Typography>Vehicle Inspection :</Typography>
                    <FormLabel>{formData.vehicleInspection}</FormLabel>
                </FormGrid>
                <FormGrid item xs={12} md={6}>
                    <Typography>Jobcard :</Typography>
                    <FormLabel>{formData.jobCard}</FormLabel>
                </FormGrid>

                <FormGrid item xs={12} md={6}>
                    <Typography>KMs Driven :</Typography>
                    <FormLabel>{formData.kmsDriven}</FormLabel>
                </FormGrid>
            </Grid>

            <FormGrid2 container spacing={2} columns={12} mt={4}>
                <Typography component="h2" variant="h6">
                    Service Part Details
                </Typography>
                <FormGrid2 mt={2}>
                    <CustomizedDataGrid columns={columns} rows={rows} checkboxSelection={false} />
                </FormGrid2>
            </FormGrid2>
        </Box>
    );
}
