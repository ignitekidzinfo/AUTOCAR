import * as React from 'react';
import { useState, ChangeEvent, FormEvent } from "react";
import apiClient from "Services/apiService";
import {
  FaExchangeAlt,  
  FaUser,         
  FaCar,          
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
  Select,
  MenuItem,
  InputAdornment,
  styled,
  Stack,
} from "@mui/material";
import { SelectChangeEvent } from '@mui/material/Select';
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

const TransactionAdd: React.FC = () => {
  const [createData, setCreateData] = useState<CreateTransaction>({
    transactionType: "CREDIT",
    userId: undefined,
    vehicleRegId: undefined,
    partNumber: "",
    quantity: 1,
    billNo: "",
  });

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

  const handleSelectChange = (event: SelectChangeEvent<"CREDIT" | "DEBIT">) => {
    setCreateData({ ...createData, transactionType: event.target.value as "CREDIT" | "DEBIT" });
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/sparePartTransactions/add", createData);
      alert(response.data.message || "Transaction created successfully");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create transaction");
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
            <FormLabel htmlFor="transactionType">
              <FaExchangeAlt style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Transaction Type
            </FormLabel>
            <Select
              name="transactionType"
              value={createData.transactionType}
              onChange={handleSelectChange}
              size="small"
              required
            >
              <MenuItem value="CREDIT">CREDIT</MenuItem>
              <MenuItem value="DEBIT">DEBIT</MenuItem>
            </Select>
          </FormGrid>

          <FormGrid item xs={12} md={6}>
            <FormLabel htmlFor="userId">
              <FaUser style={{ marginRight: 8, verticalAlign: 'middle' }} />
              User ID
            </FormLabel>
            <OutlinedInput
              name="userId"
              value={createData.userId || ""}
              onChange={handleCreateChange}
              placeholder="Enter User ID"
              type="number"
              size="small"
              startAdornment={<InputAdornment position="start">#</InputAdornment>}
            />
          </FormGrid>

          {createData.transactionType === "DEBIT" && (
            <FormGrid item xs={12} md={6}>
              <FormLabel htmlFor="vehicleRegId">
                <FaCar style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Vehicle Reg ID
              </FormLabel>
              <OutlinedInput
                name="vehicleRegId"
                value={createData.vehicleRegId || ""}
                onChange={handleCreateChange}
                placeholder="Enter Vehicle Reg ID"
                type="number"
                size="small"
                startAdornment={<InputAdornment position="start">#</InputAdornment>}
              />
            </FormGrid>
          )}

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

          {createData.transactionType === "CREDIT" && (
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
          )}

          {/* Submit Button */}
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
    </Box>
  );
};

export default TransactionAdd;