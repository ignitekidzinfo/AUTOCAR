import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';

interface InvoiceFormData {
  // Left side (Customer Details)
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerAadharNo: string;
  customerGstin: string;

  // Right side (Invoice/Vehicle Details)
  invoiceNo: string;
  date: string;
  jobcardNo: string;
  regNo: string;
  model: string;
  kmsDriven: string;

  // SPARES table
  spares: {
    srNo: number;
    particulars: string;
    qty: number;
    unitPrice: number;
    discount: number;
    taxableAmt: number;
    cgst: number;
    sgst: number;
    igst: number;
    amount: number;
  }[];

  // LABOUR WORK table
  labour: {
    srNo: number;
    particulars: string;
    qty: number;
    unitPrice: number;
    discount: number;
    taxableAmt: number;
    cgst: number;
    sgst: number;
    igst: number;
    amount: number;
  }[];

  // Totals
  subTotal: number;
  totalAmount: number;
  advanceAmount: number;
  totalInWords: string;
}

export default function InvoiceForm() {
  const [formData, setFormData] = useState<InvoiceFormData>({
    // Customer Details
    customerName: '',
    customerAddress: '',
    customerMobile: '',
    customerAadharNo: '',
    customerGstin: '',

    // Invoice/Vehicle Details
    invoiceNo: '',
    date: '',
    jobcardNo: '',
    regNo: '',
    model: '',
    kmsDriven: '',

    // SPARES table initial row
    spares: [
      {
        srNo: 1,
        particulars: '',
        qty: 1,
        unitPrice: 0,
        discount: 0,
        taxableAmt: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        amount: 0
      }
    ],
    // LABOUR WORK table initial row
    labour: [
      {
        srNo: 1,
        particulars: '',
        qty: 1,
        unitPrice: 0,
        discount: 0,
        taxableAmt: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        amount: 0
      }
    ],

    // Totals
    subTotal: 0,
    totalAmount: 0,
    advanceAmount: 0,
    totalInWords: ''
  });

  // Simple change handler for top-level inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for SPARES table fields
  const handleSparesChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: keyof InvoiceFormData['spares'][number]
  ) => {
    const newSpares = [...formData.spares];
    let fieldValue: string | number = e.target.value;
    if (
      field === 'qty' ||
      field === 'unitPrice' ||
      field === 'discount' ||
      field === 'taxableAmt' ||
      field === 'cgst' ||
      field === 'sgst' ||
      field === 'igst' ||
      field === 'amount'
    ) {
      fieldValue = parseFloat(fieldValue) || 0;
    }
    newSpares[index] = {
      ...newSpares[index],
      [field]: fieldValue
    };
    setFormData((prev) => ({
      ...prev,
      spares: newSpares
    }));
  };

  // Handler for LABOUR table fields
  const handleLabourChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: keyof InvoiceFormData['labour'][number]
  ) => {
    const newLabour = [...formData.labour];
    let fieldValue: string | number = e.target.value;
    if (
      field === 'qty' ||
      field === 'unitPrice' ||
      field === 'discount' ||
      field === 'taxableAmt' ||
      field === 'cgst' ||
      field === 'sgst' ||
      field === 'igst' ||
      field === 'amount'
    ) {
      fieldValue = parseFloat(fieldValue) || 0;
    }
    newLabour[index] = {
      ...newLabour[index],
      [field]: fieldValue
    };
    setFormData((prev) => ({
      ...prev,
      labour: newLabour
    }));
  };

  // Example submission handler
  const handleSubmit = () => {
    console.log('Invoice Form Data:', formData);
    alert('Form submitted! Check console for data.');
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Top Row: Customer & Invoice/Vehicle Details */}
      <Grid container spacing={2}>
        {/* Customer Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold">
            CUSTOMER DETAILS
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="Name"
              name="customerName"
              size="small"
              value={formData.customerName}
              onChange={handleChange}
            />
            <TextField
              label="Address"
              name="customerAddress"
              size="small"
              value={formData.customerAddress}
              onChange={handleChange}
            />
            <TextField
              label="Mobile"
              name="customerMobile"
              size="small"
              value={formData.customerMobile}
              onChange={handleChange}
            />
            <TextField
              label="Aadhar No"
              name="customerAadharNo"
              size="small"
              value={formData.customerAadharNo}
              onChange={handleChange}
            />
            <TextField
              label="GSTIN"
              name="customerGstin"
              size="small"
              value={formData.customerGstin}
              onChange={handleChange}
            />
          </Box>
        </Grid>

        {/* Invoice/Vehicle Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold">
            VEHICLE / INVOICE DETAILS
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="Invoice No"
              name="invoiceNo"
              size="small"
              value={formData.invoiceNo}
              onChange={handleChange}
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={handleChange}
            />
            <TextField
              label="Jobcard No"
              name="jobcardNo"
              size="small"
              value={formData.jobcardNo}
              onChange={handleChange}
            />
            <TextField
              label="Reg No"
              name="regNo"
              size="small"
              value={formData.regNo}
              onChange={handleChange}
            />
            <TextField
              label="Model"
              name="model"
              size="small"
              value={formData.model}
              onChange={handleChange}
            />
            <TextField
              label="KMS Driven"
              name="kmsDriven"
              size="small"
              value={formData.kmsDriven}
              onChange={handleChange}
            />
          </Box>
        </Grid>
      </Grid>

      {/* SPARES Table */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          SPARES
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">S.No</TableCell>
                <TableCell>Particulars Of Parts</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Discount</TableCell>
                <TableCell align="center">Taxable Amt</TableCell>
                <TableCell align="center">CGST</TableCell>
                <TableCell align="center">SGST</TableCell>
                <TableCell align="center">IGST</TableCell>
                <TableCell align="center">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.spares.map((item, index) => (
                <TableRow key={item.srNo}>
                  <TableCell align="center">{item.srNo}</TableCell>
                  <TableCell>
                    <TextField
                      name="particulars"
                      size="small"
                      value={item.particulars}
                      onChange={(e) => handleSparesChange(e, index, 'particulars')}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="qty"
                      type="number"
                      size="small"
                      value={item.qty}
                      onChange={(e) => handleSparesChange(e, index, 'qty')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="unitPrice"
                      type="number"
                      size="small"
                      value={item.unitPrice}
                      onChange={(e) => handleSparesChange(e, index, 'unitPrice')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="discount"
                      type="number"
                      size="small"
                      value={item.discount}
                      onChange={(e) => handleSparesChange(e, index, 'discount')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="taxableAmt"
                      type="number"
                      size="small"
                      value={item.taxableAmt}
                      onChange={(e) => handleSparesChange(e, index, 'taxableAmt')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="cgst"
                      type="number"
                      size="small"
                      value={item.cgst}
                      onChange={(e) => handleSparesChange(e, index, 'cgst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="sgst"
                      type="number"
                      size="small"
                      value={item.sgst}
                      onChange={(e) => handleSparesChange(e, index, 'sgst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="igst"
                      type="number"
                      size="small"
                      value={item.igst}
                      onChange={(e) => handleSparesChange(e, index, 'igst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="amount"
                      type="number"
                      size="small"
                      value={item.amount}
                      onChange={(e) => handleSparesChange(e, index, 'amount')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* LABOUR WORK Table */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          LABOUR WORK
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">S.No</TableCell>
                <TableCell>Particulars Of Services</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Discount</TableCell>
                <TableCell align="center">Taxable Amt</TableCell>
                <TableCell align="center">CGST</TableCell>
                <TableCell align="center">SGST</TableCell>
                <TableCell align="center">IGST</TableCell>
                <TableCell align="center">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.labour.map((item, index) => (
                <TableRow key={item.srNo}>
                  <TableCell align="center">{item.srNo}</TableCell>
                  <TableCell>
                    <TextField
                      name="particulars"
                      size="small"
                      value={item.particulars}
                      onChange={(e) => handleLabourChange(e, index, 'particulars')}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="qty"
                      type="number"
                      size="small"
                      value={item.qty}
                      onChange={(e) => handleLabourChange(e, index, 'qty')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="unitPrice"
                      type="number"
                      size="small"
                      value={item.unitPrice}
                      onChange={(e) => handleLabourChange(e, index, 'unitPrice')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="discount"
                      type="number"
                      size="small"
                      value={item.discount}
                      onChange={(e) => handleLabourChange(e, index, 'discount')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="taxableAmt"
                      type="number"
                      size="small"
                      value={item.taxableAmt}
                      onChange={(e) => handleLabourChange(e, index, 'taxableAmt')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="cgst"
                      type="number"
                      size="small"
                      value={item.cgst}
                      onChange={(e) => handleLabourChange(e, index, 'cgst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="sgst"
                      type="number"
                      size="small"
                      value={item.sgst}
                      onChange={(e) => handleLabourChange(e, index, 'sgst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="igst"
                      type="number"
                      size="small"
                      value={item.igst}
                      onChange={(e) => handleLabourChange(e, index, 'igst')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      name="amount"
                      type="number"
                      size="small"
                      value={item.amount}
                      onChange={(e) => handleLabourChange(e, index, 'amount')}
                      sx={{ width: '70px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Totals Section */}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 300 }}>
        <TextField
          label="Sub Total"
          name="subTotal"
          type="number"
          size="small"
          value={formData.subTotal}
          onChange={handleChange}
        />
        <TextField
          label="Total Amount"
          name="totalAmount"
          type="number"
          size="small"
          value={formData.totalAmount}
          onChange={handleChange}
        />
        <TextField
          label="Advance Amount"
          name="advanceAmount"
          type="number"
          size="small"
          value={formData.advanceAmount}
          onChange={handleChange}
        />
        <TextField
          label="Total in Words"
          name="totalInWords"
          size="small"
          value={formData.totalInWords}
          onChange={handleChange}
        />
      </Box>

      {/* Submit Button */}
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button variant="contained" onClick={handleSubmit}>
          Submit Invoice
        </Button>
      </Box>
    </Box>
  );
}
