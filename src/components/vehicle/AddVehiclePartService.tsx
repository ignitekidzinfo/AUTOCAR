import * as React from "react";
import { useState, useEffect } from "react";
import apiClient from "Services/apiService";
import { FaBarcode, FaRegListAlt } from "react-icons/fa";
import {
    Grid,
    Box,
    Typography,
    Button,
    OutlinedInput,
    FormLabel,
    styled,
    Stack,
    Snackbar,
    Alert,
    Autocomplete,
    TextField,
    IconButton,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import CustomizedDataGrid from "components/CustomizedDataGrid";
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import DeleteIcon from "@mui/icons-material/Delete";
import SparePartDeleteModel from "./SparePartDeleteModel";


const FormGrid = styled(Grid)(() => ({
    display: "flex",
    flexDirection: "column",
}));

interface CreateTransaction {
    vehicleRegId?: number;
    partNumber: string;
    partName: string;
    quantity: number;
    amount: number;
    total: number;
    transactionType: string;
    billNo: number;
    sparePartTransactionId: number;
}

interface Feedback {
    message: string;
    severity: "success" | "error";
}

interface SparePart {
    sparePartId: number;
    partName: string;
    description: string;
    manufacturer: string;
    price: number;
    updateAt: string;
    partNumber: number;
}

const initialCreateData: CreateTransaction = {
    vehicleRegId: undefined,
    partNumber: "",
    partName: "",
    quantity: 1,
    amount: 0,
    total: 0,
    transactionType: "DEBIT",
    billNo: 1,
    sparePartTransactionId: 0
};

const AddVehiclePartService: React.FC = () => {
    const [createData, setCreateData] = useState<CreateTransaction>(initialCreateData);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [rows, setRows] = useState<GridRowsProp>([]);
    const [partSuggestions, setPartSuggestions] = useState<SparePart[]>([]);
    const [open, setOpen] = React.useState<boolean>(false);
    const [selectedId, setSelectedId] = React.useState<number>(0);

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        fetchParts();
    }, []);

    useEffect(() => {
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

            // Ensure responsePart.data is an array
            const transactions: any = Array.isArray(responsePart.data)
                ? responsePart.data
                : [responsePart.data];
            console.log(transactions[0].data)
            const transactionsData = transactions[0].data;
            // Transform each transaction
            const newTransactions = transactionsData.map((resData: any, index: number) => ({
                id: rows.length + index + 1, // Assign a unique ID
                partNumber: resData.partNumber,
                partName: resData.partName,
                quantity: resData.quantity,
                amount: resData.price,
                total: resData.price * resData.quantity,
                transactionType: resData.transactionType,
                vehicleRegId: resData.vehicleRegId,
                sparePartTransactionId: resData.sparePartTransactionId
            }));

            // Append new transactions to the state
            setRows([...newTransactions]);
        } catch (err) {
            console.error("Error fetching transactions:", err);
        }
    };

    const fetchParts = async () => {
        try {
            // Fetch all spare parts
            const response = await apiClient.get(
                `https://carauto01-production-8b0b.up.railway.app/sparePartManagement/getAll`
            );

            // Fetch spare part transactions based on vehicleRegId
            if (!id) {
                console.error("Vehicle Registration ID is missing");
                return;
            }



            // Update part suggestions
            const parts: SparePart[] = response.data || [];
            setPartSuggestions(parts);

        } catch (error) {
            console.error("Error fetching parts:", error);
        }
    };


    const handleCreateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setCreateData((prev) => ({
            ...prev,
            [name]: name === "quantity" ? Number(value) : value,
        }));
    };

    const handleSelectPart = (event: any, newValue: SparePart | null) => {
        if (newValue) {
            setCreateData((prev) => ({
                ...prev,
                partName: newValue.partName,
                partNumber: String(newValue.partNumber),
                amount: newValue.price
            }));
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...createData,
                vehicleRegId: Number(id),
                userId: 1,// Ensure conversion to number
            };
            const response = await apiClient.post("/sparePartTransactions/add", updatedData);
            console.log("check my data :", response);
            const sparePartTransactionId = response.data?.data.sparePartTransactionId;
            const newTransaction = {
                id: rows.length + 1, // Assign unique id
                partNumber: updatedData.partNumber,
                partName: updatedData.partName,
                quantity: updatedData.quantity,
                amount: updatedData.amount,
                total: updatedData.amount * updatedData.quantity,
                transactionType: updatedData.transactionType,
                vehicleRegId: updatedData.vehicleRegId,
                sparePartTransactionId: sparePartTransactionId
            };

            setRows((prevRows) => [...prevRows, newTransaction]); // Append new record
            setFeedback({
                message: response.data.message || "Transaction created successfully",
                severity: "success",
            });
            setCreateData(initialCreateData);
        } catch (error: any) {
            setFeedback({
                message: error.response?.data?.message || "Failed to create transaction",
                severity: "error",
            });
        }
    };

    const handleCloseSnackbar = () => {
        setFeedback(null);
    };

    const handleDelete = (id: number) => {
        setSelectedId(id);
        setOpen(true);
    };

    const handleDeleteConfirmed = (id: number) => {
        setRows((prevRows) => prevRows.filter((row) => row.sparePartTransactionId !== id));
    };


    function renderActionButtons(params: GridCellParams) {
        return (
            <>
                <IconButton color="secondary" onClick={() => handleDelete(params.row.sparePartTransactionId as number)}>
                    <DeleteIcon />
                </IconButton>
            </>
        );
    }

    const columns: GridColDef[] = [
        { field: "id", flex: 1, headerName: "ID", width: 80 },
        { field: "partNumber", flex: 1, headerName: "Part Number", width: 150 },
        { field: "partName", flex: 1, headerName: "Part Name", width: 200 },
        { field: "quantity", flex: 1, headerName: "Quantity", width: 120 },
        { field: "amount", flex: 1, headerName: "Amount", width: 150 },
        { field: "total", flex: 1, headerName: "Total", width: 150 },
        { field: "", flex: 1, headerName: "Action", width: 120, renderCell: (params) => renderActionButtons(params), },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, width: "100%" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography component="h2" variant="h6">
                    Add Vehicle Service Parts
                </Typography>
                <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Stack>

            <form onSubmit={handleCreateSubmit}>
                <Grid container spacing={3}>
                    <FormGrid item xs={12} md={6}>
                        <FormLabel htmlFor="partName">
                            <FaBarcode style={{ marginRight: 8, verticalAlign: "middle" }} />
                            Part Name
                        </FormLabel>
                        <Autocomplete
                            disablePortal
                            options={partSuggestions}
                            getOptionLabel={(option) => option.partName}
                            sx={{ width: 300 }}
                            onChange={handleSelectPart}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </FormGrid>

                    <FormGrid item xs={12} md={6}>
                        <FormLabel htmlFor="partNumber">
                            <FaBarcode style={{ marginRight: 8, verticalAlign: "middle" }} />
                            Part Number
                        </FormLabel>
                        <OutlinedInput
                            name="partNumber"
                            value={createData.partNumber}
                            onChange={handleCreateChange}
                            placeholder="Auto-filled Part Number"
                            size="small"
                            required
                            disabled
                        />
                    </FormGrid>

                    <FormGrid item xs={12} md={6}>
                        <FormLabel htmlFor="quantity">
                            <FaRegListAlt style={{ marginRight: 8, verticalAlign: "middle" }} />
                            Quantity
                        </FormLabel>
                        <OutlinedInput
                            name="quantity"
                            value={createData.quantity}
                            onChange={handleCreateChange}
                            type="number"
                            size="small"
                            required
                            inputProps={{ min: 1 }}
                        />
                    </FormGrid>

                    <FormGrid item xs={12}>
                        <Button type="submit" variant="contained" color="primary">
                            Create Transaction
                        </Button>
                    </FormGrid>
                </Grid>
            </form>
            {rows.length !== 0 ? (
                <FormGrid container spacing={2} columns={12} mt={4}>
                    <FormGrid >
                        <CustomizedDataGrid columns={columns} rows={rows} />
                    </FormGrid>
                </FormGrid>
            ) : <></>}
            <SparePartDeleteModel open={open} onClose={() => setOpen(false)} deleteItemId={selectedId} onDelete={handleDeleteConfirmed} />

            <Snackbar
                open={!!feedback}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {feedback ? (
                    <Alert onClose={handleCloseSnackbar} severity={feedback.severity} sx={{ width: '100%' }}>
                        {feedback.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Box>
    );
};

export default AddVehiclePartService;
