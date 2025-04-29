import React, { useState ,useEffect, useMemo} from 'react';
import { FormControl, Stack, Button, TextField, Typography, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter } from '@mui/material';
import Copyright from 'internals/components/Copyright'; 
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';

interface Part {
  id: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalAmount: number;
}

interface Labour {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalAmount: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  jobCardNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerAadharNo: string;
  customerGstin: string;
  vehicleRegId: string;
  regNo: string;
  model: string;
  kmsDriven: string;
  vehicleNo: string;
  comments: string;
  parts: Part[];
  labours: Labour[];
  globalDiscount: number;
  subTotal: number;
  partsSubtotal:number ;
  laboursSubtotal:number;
  totalAmount: number | null; 
advanceAmount: number;
  totalInWords: string;
}

const JobSaleReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    if (fromDate && toDate) {
      setLoading(true); 
      try {
        const response = await fetch(`https://carauto01-production-8b0b.up.railway.app/api/vehicle-invoices/search/date-range?startDate=${fromDate}&endDate=${toDate}`);
        const data = await response.json();
        console.log("Fetched invoice data:", data);
        setRows(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    } else {
    }
  };

  useEffect(() => {
    if (fromDate && toDate) {
      fetchInvoices();
    }
  }, [fromDate, toDate]);

  const handlePrint = () => {
    if (gridRows.length === 0) {
      alert('No data to print');
      return;
    }

    // Get the first invoice number from the grid rows
    const firstInvoiceNumber = gridRows[0].invoiceNumber;
    
    // Open in new window instead of navigating
    window.open(`/admin/jobsalereportPdf?invoiceNumber=${firstInvoiceNumber}`, '_blank');
  };

  const handleSafePrint = (invoiceNumber: string) => {
    // Open in new window instead of navigating
    window.open(`/admin/jobsalereportPdf?invoiceNumber=${invoiceNumber}`, '_blank');
  };

  const handlePrintAll = () => {
    if (gridRows.length === 0) {
      alert('No data to print');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    // Calculate total
    const total = gridRows.reduce((sum, row) => sum + row.grandTotal, 0);

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Sale Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .report-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .report-header h2 {
              margin: 0 0 5px 0;
              font-size: 16pt;
            }
            .report-header p {
              margin: 0;
              font-size: 10pt;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10pt;
            }
            th, td {
              border: 1px solid black;
              padding: 4px 8px;
              text-align: left;
            }
            th {
              font-weight: bold;
              border-bottom: 2px solid black;
            }
            .total-row td {
              font-weight: bold;
            }
            .amount {
              text-align: right;
            }
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h2>Job Sale Report</h2>
            <p>From ${fromDate} To ${toDate}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>ID</th>
                <th>Vehicle No</th>
                <th>Invoice Date</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${gridRows.map((row, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${row.invoiceNumber}</td>
                  <td>${row.vehicleNo}</td>
                  <td>${new Date(row.invDate).toLocaleDateString('en-GB')}</td>
                  <td class="amount">₹${row.grandTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">Total</td>
                <td class="amount">₹${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
      // Close the window after printing (optional)
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  function renderActionButtons(params: GridCellParams) {
        return (
            <IconButton
              color="secondary"
        onClick={() => handleSafePrint(params.row.invoiceNumber)}
            >
              <Print />
            </IconButton>
    );
  }

  const gridRows = rows.map((invoice, index) => {
    console.log(`Invoice ${invoice.invoiceNumber} total amount:`, invoice.totalAmount);
    const totalAmount = Number(invoice.totalAmount || 0);
    
    return {
      id: index + 1,
      invoiceNumber: invoice.invoiceNumber,
      vehicleNo: invoice.regNo || 'N/A',
      invDate: invoice.invoiceDate,
      grandTotal: totalAmount
    };
  });

  const grandTotalSum = useMemo(() => {
    return gridRows.reduce((sum, row) => sum + (row.grandTotal || 0), 0);
  }, [gridRows]);

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Typography variant="h4" gutterBottom>
     Job Sale Report
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={2} sx={{ mb: 2 }}>
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
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sr.No</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Vehicle No</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>Grand Total</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gridRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.invoiceNumber}</TableCell>
                <TableCell>{row.vehicleNo}</TableCell>
                <TableCell>{row.invDate}</TableCell>
                <TableCell>₹{row.grandTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton
                    color="secondary"
                    onClick={() => handleSafePrint(row.invoiceNumber)}
                  >
                    <Print />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>₹{grandTotalSum.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
          onClick={handlePrintAll}
        >
          Print All
    </button>
</div>
      <Copyright />
    </Box>
  );
};

export default JobSaleReport;