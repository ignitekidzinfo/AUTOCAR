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
  Button,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import apiClient from 'Services/apiService';

interface InvoiceFormData {
  vehicleRegId: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerAadharNo: string;
  customerGstin: string;
  date: string;
  regNo: string;
  model: string;
  kmsDriven: string;
  comments: string;
  parts: {
    partName: string;
    quantity: number | string;
    unitPrice: number | string;
    discountPercent: number | string;
    cgstPercent: number | string;
    sgstPercent: number | string;
    igstPercent: number | string;
  }[];
  labours: {
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    discountPercent: number | string;
    cgstPercent: number | string;
    sgstPercent: number | string;
    igstPercent: number | string;
  }[];
  subTotal: number;
  totalAmount: number;
  advanceAmount: number;
  totalInWords: string;
}

const defaultInvoiceData: InvoiceFormData = {
  vehicleRegId: '',
  customerName: '',
  customerAddress: '',
  customerMobile: '',
  customerAadharNo: '',
  customerGstin: '',
  date: '',
  regNo: '',
  model: '',
  kmsDriven: '',
  comments: '',
  parts: [],
  labours: [
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0
    }
  ],
  subTotal: 0,
  totalAmount: 0,
  advanceAmount: 0,
  totalInWords: ''
};

export default function InvoiceForm() {
  const [formData, setFormData] = useState<InvoiceFormData>(defaultInvoiceData);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Generic change handler for text and numeric fields.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // For numeric fields, allow empty string but default advanceAmount to 0.
    if (['subTotal', 'totalAmount', 'advanceAmount'].includes(name)) {
      if (value !== '' && parseFloat(value) < 0) return;
      const newValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: newValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handler for parts changes.
  const handlePartsChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: keyof InvoiceFormData['parts'][number]
  ) => {
    const newParts = [...formData.parts];
    let fieldValue: string | number = e.target.value;
    if (['quantity', 'unitPrice', 'discountPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(field)) {
      if (e.target.value !== '' && parseFloat(e.target.value) < 0) return;
      fieldValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
    }
    newParts[index] = { ...newParts[index], [field]: fieldValue };
    setFormData(prev => ({ ...prev, parts: newParts }));
  };

  // Handler for labours changes.
  const handleLabourChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: keyof InvoiceFormData['labours'][number]
  ) => {
    const newLabours = [...formData.labours];
    let fieldValue: string | number = e.target.value;
    if (['quantity', 'unitPrice', 'discountPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(field)) {
      if (e.target.value !== '' && parseFloat(e.target.value) < 0) return;
      fieldValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
    }
    newLabours[index] = { ...newLabours[index], [field]: fieldValue };
    setFormData(prev => ({ ...prev, labours: newLabours }));
  };

  // Add new labour row.
  const addLabourRow = () => {
    setFormData(prev => ({
      ...prev,
      labours: [
        ...prev.labours,
        { description: '', quantity: 1, unitPrice: 0, discountPercent: 0, cgstPercent: 0, sgstPercent: 0, igstPercent: 0 }
      ]
    }));
  };

  // Compute totals for parts and labours.
  const computeTotals = () => {
    const computeItemTotal = (item: {
      quantity: number | string;
      unitPrice: number | string;
      discountPercent: number | string;
      cgstPercent: number | string;
      sgstPercent: number | string;
      igstPercent: number | string;
    }) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const cgst = Number(item.cgstPercent) || 0;
      const sgst = Number(item.sgstPercent) || 0;
      const igst = Number(item.igstPercent) || 0;
      
      const base = quantity * unitPrice;
      const discount = base * discountPercent / 100;
      const netBase = base - discount;
      const taxRate = (cgst + sgst + igst) / 100;
      const taxAmount = netBase * taxRate;
      return netBase + taxAmount;
    };

    const partsTotal = formData.parts.reduce((sum, item) => sum + computeItemTotal(item), 0);
    const laboursTotal = formData.labours.reduce((sum, item) => sum + computeItemTotal(item), 0);
    const subTotal = partsTotal + laboursTotal;
    const totalAmount = subTotal; // Modify here if you add further charges or adjustments.
    return { subTotal, totalAmount };
  };

  // Fetch vehicle details and spare parts using query parameters.
  const fetchVehicleData = async () => {
    if (!formData.vehicleRegId) return;
    setLoadingData(true);
    try {
      const vid = formData.vehicleRegId;
      // Fetch vehicle details.
      const vehicleResponse = await apiClient.get('/vehicle-reg/getById', {
        params: { vehicleRegId: vid }
      });
      console.log('Vehicle Response:', vehicleResponse.data);
      const vehicleData = vehicleResponse.data.data || vehicleResponse.data;
      if (vehicleData) {
        setFormData(prev => ({
          ...prev,
          customerName: vehicleData.customerName || '',
          customerAddress: vehicleData.customerAddress || '',
          customerMobile: vehicleData.customerMobileNumber || '',
          customerAadharNo: vehicleData.customerAadharNo || '',
          customerGstin: vehicleData.customerGstin || '',
          regNo: vehicleData.vehicleNumber || '',
          model: `${vehicleData.vehicleBrand || ''} - ${vehicleData.vehicleModelName || ''}`
        }));
      } else {
        alert('No vehicle data found.');
      }

      // Fetch spare parts.
      const partsResponse = await apiClient.get('/sparePartTransactions/vehicleRegId', {
        params: { vehicleRegId: vid }
      });
      console.log('Parts Response:', partsResponse.data);
      let partsArray: any[] = [];
      if (partsResponse.data && partsResponse.data.data && Array.isArray(partsResponse.data.data)) {
        partsArray = partsResponse.data.data;
      } else if (Array.isArray(partsResponse.data)) {
        partsArray = partsResponse.data;
      } else {
        console.error('Parts data is not an array:', partsResponse.data);
      }
      const parts = partsArray.map((p: any) => ({
        partName: p.partName,
        quantity: p.quantity || 1,
        unitPrice: p.price || 0,
        discountPercent: 0,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0
      }));
      setFormData(prev => ({ ...prev, parts }));
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching vehicle or parts data.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle form submission to generate PDF.
  const handleSubmit = async () => {
    const totals = computeTotals();
    // Ensure advanceAmount is set to 0 if not entered.
    const advanceAmount = formData.advanceAmount || 0;
    const submissionData = {
      ...formData,
      subTotal: totals.subTotal,
      totalAmount: totals.totalAmount,
      advanceAmount: advanceAmount
    };

    console.log('Submitting invoice:', submissionData);
    try {
      const response = await apiClient.post('/pdf/generate', submissionData, {
        responseType: 'blob'
      });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF.');
    }
  };

  // Compute totals for display.
  const totals = computeTotals();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Generate Invoice
      </Typography>

      {/* Vehicle Reg ID and Fetch Button */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Vehicle Reg ID"
            name="vehicleRegId"
            size="small"
            fullWidth
            value={formData.vehicleRegId}
            onChange={handleChange}
          />
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={fetchVehicleData} disabled={loadingData}>
            {loadingData ? 'Fetching...' : 'Fetch Vehicle Data'}
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={2}>
        {/* CUSTOMER DETAILS */}
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

        {/* VEHICLE / INVOICE DETAILS */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold">
            VEHICLE / INVOICE DETAILS
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
            <TextField
              label="Advance Amount"
              name="advanceAmount"
              type="number"
              size="small"
              value={formData.advanceAmount}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Comments"
              name="comments"
              size="small"
              value={formData.comments}
              onChange={handleChange}
            />
          </Box>
        </Grid>
      </Grid>

      {/* SPARES TABLE */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          SPARES
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">S.No</TableCell>
                <TableCell>Part Name</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Discount (%)</TableCell>
                <TableCell align="center">CGST (%)</TableCell>
                <TableCell align="center">SGST (%)</TableCell>
                <TableCell align="center">IGST (%)</TableCell>
                <TableCell align="center">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.parts.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const discountPercent = Number(item.discountPercent) || 0;
                const base = quantity * unitPrice;
                const discount = base * discountPercent / 100;
                const net = base - discount;
                const amount = net; // Taxes can be added if needed.
                return (
                  <TableRow key={index}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      <TextField
                        name="partName"
                        size="small"
                        fullWidth
                        value={item.partName}
                        onChange={(e) => handlePartsChange(e, index, 'partName')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="quantity"
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handlePartsChange(e, index, 'quantity')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="unitPrice"
                        type="number"
                        size="small"
                        value={item.unitPrice}
                        onChange={(e) => handlePartsChange(e, index, 'unitPrice')}
                        sx={{ width: '100px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="discountPercent"
                        type="number"
                        size="small"
                        value={item.discountPercent}
                        onChange={(e) => handlePartsChange(e, index, 'discountPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="cgstPercent"
                        type="number"
                        size="small"
                        value={item.cgstPercent}
                        onChange={(e) => handlePartsChange(e, index, 'cgstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="sgstPercent"
                        type="number"
                        size="small"
                        value={item.sgstPercent}
                        onChange={(e) => handlePartsChange(e, index, 'sgstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="igstPercent"
                        type="number"
                        size="small"
                        value={item.igstPercent}
                        onChange={(e) => handlePartsChange(e, index, 'igstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography>{amount.toFixed(2)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {formData.parts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No spare parts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* LABOUR WORK TABLE */}
      <Box sx={{ mt: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight="bold">
            LABOUR WORK
          </Typography>
          <IconButton onClick={addLabourRow} size="small">
            <AddIcon />
          </IconButton>
        </Box>
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">S.No</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Discount (%)</TableCell>
                <TableCell align="center">CGST (%)</TableCell>
                <TableCell align="center">SGST (%)</TableCell>
                <TableCell align="center">IGST (%)</TableCell>
                <TableCell align="center">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.labours.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const discountPercent = Number(item.discountPercent) || 0;
                const base = quantity * unitPrice;
                const discount = base * discountPercent / 100;
                const net = base - discount;
                const amount = net; // Taxes can be added if needed.
                return (
                  <TableRow key={index}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      <TextField
                        name="description"
                        size="small"
                        fullWidth
                        value={item.description}
                        onChange={(e) => handleLabourChange(e, index, 'description')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="quantity"
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleLabourChange(e, index, 'quantity')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="unitPrice"
                        type="number"
                        size="small"
                        value={item.unitPrice}
                        onChange={(e) => handleLabourChange(e, index, 'unitPrice')}
                        sx={{ width: '100px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="discountPercent"
                        type="number"
                        size="small"
                        value={item.discountPercent}
                        onChange={(e) => handleLabourChange(e, index, 'discountPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="cgstPercent"
                        type="number"
                        size="small"
                        value={item.cgstPercent}
                        onChange={(e) => handleLabourChange(e, index, 'cgstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="sgstPercent"
                        type="number"
                        size="small"
                        value={item.sgstPercent}
                        onChange={(e) => handleLabourChange(e, index, 'sgstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        name="igstPercent"
                        type="number"
                        size="small"
                        value={item.igstPercent}
                        onChange={(e) => handleLabourChange(e, index, 'igstPercent')}
                        sx={{ width: '70px' }}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography>{amount.toFixed(2)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {formData.labours.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No labour work added.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Final Amounts (computed) */}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 300 }}>
        <TextField
          label="Sub Total"
          name="subTotal"
          type="number"
          size="small"
          value={totals.subTotal.toFixed(2)}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Total Amount"
          name="totalAmount"
          type="number"
          size="small"
          value={totals.totalAmount.toFixed(2)}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Total in Words"
          name="totalInWords"
          size="small"
          value={formData.totalInWords}
          onChange={handleChange}
        />
      </Box>

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button variant="contained" onClick={handleSubmit}>
          Generate Invoice PDF
        </Button>
      </Box>

      {/* PDF Preview & Download */}
      {pdfUrl && (
        <Box mt={4}>
          <Typography variant="h6" mb={1}>
            PDF Preview
          </Typography>
          <iframe
            title="Invoice PDF"
            src={pdfUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
          />
          <Box textAlign="right" mt={1}>
            <Button variant="outlined" onClick={() => {
              const link = document.createElement('a');
              link.href = pdfUrl;
              link.download = 'invoice.pdf';
              link.click();
            }}>
              Download PDF
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
