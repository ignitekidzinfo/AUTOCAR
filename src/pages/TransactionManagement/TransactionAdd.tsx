import * as React from 'react';
import { useState,  FormEvent } from "react";
import apiClient from "Services/apiService";
import {
  FaBarcode,
  FaRegListAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  Box,
  Grid,
  Typography,
  Button,
  OutlinedInput,
  FormLabel,
  styled,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from 'react-router-dom';

const FormGrid = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
}));

interface CreateTransaction {
  transactionType: "CREDIT" | "DEBIT";
  userId?: number;
  vehicleRegId?: number;
  partNumber: string;
  quantity: number;
  billNo?: string;
}

interface Feedback {
  message: string;
  severity: "success" | "error";
}

const initialCreateData: CreateTransaction = {
  transactionType: "CREDIT",
  userId: 10006,
  vehicleRegId: undefined,
  partNumber: "",
  quantity: 1,
  billNo: "",
};

const TransactionAdd: React.FC = () => {
  const [createData, setCreateData] = useState<CreateTransaction>(initialCreateData);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  // const handleSelectChange = (event: SelectChangeEvent<"CREDIT" | "DEBIT">) => {
  //   setCreateData({ ...createData, transactionType: event.target.value as "CREDIT" | "DEBIT" });
  // };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/sparePartTransactions/add", createData);
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
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="h6">
          Add Transaction
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Stack>

      <form onSubmit={handleCreateSubmit}>
        <Grid container spacing={3}>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="partNumber">
              <FaBarcode style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Part Number
            </FormLabel>
            <OutlinedInput
              name="partNumber"
              value={createData.partNumber}
              onChange={handleCreateChange}
              placeholder="Enter Part Number"
              size="small"
              required
            />
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="quantity">
              <FaRegListAlt style={{ marginRight: 8, verticalAlign: 'middle' }} />
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

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="billNo">
              <FaMoneyBillWave style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Bill Number
            </FormLabel>
            <OutlinedInput
              name="billNo"
              value={createData.billNo}
              onChange={handleCreateChange}
              placeholder="Enter Bill Number"
              size="small"
              required
            />
          </FormGrid>

          <FormGrid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              fullWidth
            >
              Create Transaction
            </Button>
          </FormGrid>
        </Grid>
      </form>

      <Snackbar 
        open={!!feedback} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default TransactionAdd;
