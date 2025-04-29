import React, { useEffect, useState } from 'react';
import {
    Container,
    Stack,
    Typography,
    Button,
    Grid,
    FormLabel,
    OutlinedInput,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from 'Services/apiService';

interface PartLine {
    id: number;
    lineNo: number;
    partName: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmt: number;
    finalAmount: number;
}

interface LabourLine {
    id: number;
    lineNo: number;
    name: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmt: number;
    finalAmount: number;
}

interface Quotation {
    id: number;
    quotationNumber: string | null;
    quotationDate: string;
    customerName: string;
    customerAddress: string;
    customerMobile: string;
    vehicleNumber: string;
    customerEmail: string;
    partLines: PartLine[];
    labourLines: LabourLine[];
}

const QuotationEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [formData, setFormData] = useState<Quotation | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [dialogTitle, setDialogTitle] = useState('');

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const response = await apiClient.get(`/api/quotations/${id}`);
                const data: Quotation = response.data;
                setQuotation(data);
                setFormData(data); // Initialize form data with fetched quotation
            } catch (error) {
                console.error('Error fetching quotation:', error);
            }
        };

        fetchQuotation();
    }, [id]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = event.target as { name: string; value: string }; // Type assertion for name
        if (formData) {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (formData) {
            // Create an object with only the fields that have changed
            const updates = {
                customerName: formData.customerName,
                customerAddress: formData.customerAddress,
                customerMobile: formData.customerMobile,
                customerEmail: formData.customerEmail,
                vehicleNumber: formData.vehicleNumber,
                quotationDate: formData.quotationDate,
                quotationNumber: formData.quotationNumber,
                // Add partLines and labourLines if needed
            };

            try {
                const response = await apiClient.patch(`/api/quotations/${id}`, updates);

                if (response.status >= 200 && response.status < 300) {
                    setDialogTitle('Success');
                    setDialogMessage('Quotation updated successfully!');
                } else {
                    setDialogTitle('Error');
                    setDialogMessage('Failed to update quotation.');
                }
                setDialogOpen(true);
            } catch (error) {
                console.error('Error updating quotation:', error);
                setDialogTitle('Error');
                setDialogMessage('Failed to update quotation.');
                setDialogOpen(true);
            }
        }
    };

    if (!quotation) {
        return <div>Loading...</div>; // Handle loading state
    }

    return (
        <>
        <Container>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography component="h2" variant="h6">
                    Update Quotation
                </Typography>
                <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Stack>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="customerName">Customer Name</FormLabel>
                        <OutlinedInput
                            id="customerName"
                            name="customerName"
                            value={formData!.customerName || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Customer Name"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="customerAddress">Customer Address</FormLabel>
                        <OutlinedInput
                            id="customerAddress"
                            name="customerAddress"
                            value={formData!.customerAddress || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Customer Address"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="customerMobile">Mobile Number</FormLabel>
                        <OutlinedInput
                            id="customerMobile"
                            name="customerMobile"
                            value={formData!.customerMobile || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Mobile Number"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="customerEmail">Email</FormLabel>
                        <OutlinedInput
                            id="customerEmail"
                            name="customerEmail"
                            value={formData!.customerEmail || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Email"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="vehicleNumber">Vehicle Number</FormLabel>
                        <OutlinedInput
                            id="vehicleNumber"
                            name="vehicleNumber"
                            value={formData!.vehicleNumber || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Vehicle Number"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="quotationNumber">Vehicle Number</FormLabel>
                        <OutlinedInput
                            id="quotationNumber"
                            name="quotationNumber"
                            value={formData!.quotationNumber || "NA"} // Non-null assertion
                            onChange={handleChange}
                            placeholder="Enter Quotation Number"
                            required
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel htmlFor="quotationDate">Quotation Date</FormLabel>
                        <OutlinedInput
                            id="quotationDate"
                            name="quotationDate"
                            type="date"
                            value={formData!.quotationDate || "NA"} // Non-null assertion
                            onChange={handleChange}
                            required
                            size="small"
                        />
                    </Grid>
                    {/* Add more fields as necessary for partLines and labourLines */}
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" color="primary" fullWidth>
                            Update Quotation
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
        </Container>
        </>
    );
};

export default QuotationEdit;