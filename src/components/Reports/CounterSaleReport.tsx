import React, { useState, useEffect, useMemo } from 'react';
import { FormControl, Stack, Button, TextField, Typography, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter } from '@mui/material';
import Copyright from 'internals/components/Copyright'; 
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';

// Add print styles to hide elements when printing
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #print-container, #print-container * {
      visibility: visible;
    }
    #print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
    }
    #print-header {
      display: block !important;
      visibility: visible;
      text-align: center;
      margin-bottom: 20px;
    }
    #print-header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    #print-header p {
      font-size: 14px;
      margin-bottom: 20px;
    }
    .MuiPaper-root {
      box-shadow: none !important;
      border: none !important;
    }
    .print-hide {
      display: none !important;
    }
    .MuiTableCell-root {
      padding: 8px 16px;
      border: 1px solid #ddd;
    }
    .MuiTableHead-root .MuiTableCell-root {
      font-weight: bold;
      background-color: #f5f5f5;
    }
  }
`;

interface InvoiceItem {
  id: number;
  spareName: string;
  spareNo: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmt: number;
  taxableValue: number;
  cgstPercent: number;
  amount: number;
  sgstPercent: number;
  cgstAmt: number;
  sgstAmt: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  adharNo: string;
  gstin: string;
  vehicleNo: string;
  totalAmount: number;
  discount: number;
  netTotal: number;
  items: InvoiceItem[];
}

interface InvoiceWithTotals extends Invoice {
  totalQuantity: number;
  taxable: number;
}

const CounterSaleReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rows, setRows] = useState<InvoiceWithTotals[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    if (fromDate && toDate) {
      setLoading(true);
      try {
        const response = await fetch(`https://carauto01-production-8b0b.up.railway.app/api/invoices/dateRange?from=${fromDate}&to=${toDate}`);
        const data: Invoice[] = await response.json();
        console.log("Fetched invoice data:", data);
  
        const formattedRows: InvoiceWithTotals[] = data.map((invoice) => {
          let totalTaxable = 0;
          
          invoice.items.forEach(item => {
            let itemTaxable = 0;
            if (item.amount) {
              const totalGstPercent = (item.cgstPercent || 0) + (item.sgstPercent || 0);
              if (totalGstPercent > 0) {
                itemTaxable = Number(item.amount) / (1 + (totalGstPercent / 100));
                itemTaxable = Number(itemTaxable.toFixed(2));
              } else {
                itemTaxable = Number(item.amount);
              }
            } else {
              itemTaxable = Number(item.taxableValue) || 0;
            }
            
            console.log(`Item ${item.spareName} - Amount: ${item.amount}, GST: ${(item.cgstPercent || 0) + (item.sgstPercent || 0)}%, Calculated taxable: ${itemTaxable}`);
            totalTaxable += itemTaxable;
          });

          const totalQuantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
          
          totalTaxable = Number(totalTaxable.toFixed(2));
          console.log(`Invoice ${invoice.invoiceNumber} final calculated taxable: ${totalTaxable}`);
          
          return {
            ...invoice, 
            totalQuantity, 
            taxable: totalTaxable, 
          };
        });
  
        console.log("Formatted rows with taxable amounts:", formattedRows);
  
        setRows(formattedRows);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
    useEffect(() => {
      if (fromDate && toDate) {
        fetchInvoices();
      }
  }, [fromDate, toDate]); 
  
  const handlePrint = (invoiceId?: number, invoiceNumber?: string) => {
    if (invoiceId && invoiceNumber) {
      console.log(`Printing individual invoice: ${invoiceNumber} with ID: ${invoiceId}`);
      
      const invoice = rows.find(row => row.id === invoiceId);
      
      if (!invoice) {
        console.error(`Invoice with ID ${invoiceId} not found in loaded data`);
        alert('Invoice data not found. Please try again.');
        return;
      }
      
      const dataToSend = {
      fromDate,
      toDate,
        reportData: [invoice]
    };

      console.log('Sending data to print individual invoice:', dataToSend);
    const query = encodeURIComponent(JSON.stringify(dataToSend));
      window.open(`/admin/countersalereportPdf?data=${query}`, '_blank');
    } else {
      // For 'Print All', use the browser's native print functionality
      console.log('Printing all invoices using browser print');
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  function renderActionButtons(params: GridCellParams) {
    return (
      <IconButton
        color="secondary"
        onClick={() => handlePrint(params.row.id, params.row.invoiceNumber)}
      >
        <Print />
      </IconButton>
    );
  }

  const totals = useMemo(() => {
    return rows.reduce(
      (sums, row) => {
        return {
          quantity: sums.quantity + (row.totalQuantity || 0),
          taxable: sums.taxable + (row.taxable || 0),
          total: sums.total + (row.totalAmount || 0)
        };
      },
      { quantity: 0, taxable: 0, total: 0 }
    );
  }, [rows]);

  const formattedFromDate = fromDate ? new Date(fromDate).toLocaleDateString() : '';
  const formattedToDate = toDate ? new Date(toDate).toLocaleDateString() : '';

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      {/* Add print styles */}
      <style>{printStyles}</style>
      
      {/* Only one title for screen view */}
      <Typography variant="h4" gutterBottom className="print-hide">
        Counter Sale Report
      </Typography>
      
      {/* Date filters - hidden when printing */}
      <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={2} sx={{ mb: 2 }} className="print-hide">
        <FormControl>
          <TextField
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <TextField
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              fetchInvoices(); 
            }}
          />
        </FormControl>
        {loading && <p>Loading...</p>}
      </Stack>
      
      {/* Main container for printing */}
      <div id="print-container">
        {/* Print header */}
        <div id="print-header" style={{ display: 'none' }}>
          <h1>Counter Sale Report</h1>
          <p>From {formattedFromDate} To {formattedToDate}</p>
        </div>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sr.No</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Total Quantity</TableCell>
                <TableCell>Taxable</TableCell>
                <TableCell>Grand Total</TableCell>
                <TableCell className="print-hide">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.invoiceNumber}</TableCell>
                  <TableCell>{row.invDate}</TableCell>
                  <TableCell>{row.totalQuantity}</TableCell>
                  <TableCell>₹{Number(row.taxable).toFixed(2)}</TableCell>
                  <TableCell>₹{Number(row.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell className="print-hide">
                    <IconButton
                      color="secondary"
                      onClick={() => handlePrint(row.id, row.invoiceNumber)}
                    >
                      <Print />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{totals.quantity}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(totals.taxable).toFixed(2)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>₹{Number(totals.total).toFixed(2)}</TableCell>
                <TableCell className="print-hide"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </div>

      {/* Print button - hidden when printing */}
      <div style={{ marginTop: '20px', textAlign: 'center' }} className="print-hide">
        <button
          style={{
            border: 'none',
            borderRadius: '5px',
            padding: '10px 20px',
            backgroundColor: '#60B5FF',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#AFDDFF')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#60B5FF')}
          onClick={() => handlePrint()}
        >
          Print All
        </button>
      </div>
      
      {/* Copyright - hidden when printing */}
      <div className="print-hide">
      <Copyright />
      </div>
    </Box>
  );
};

export default CounterSaleReport;