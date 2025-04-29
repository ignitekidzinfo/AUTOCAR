import React, { useState, useEffect } from 'react';
import { FormControl, Stack, Button, TextField, Typography, IconButton } from '@mui/material';
import CustomizedDataGrid from 'components/CustomizedDataGrid';
import Copyright from 'internals/components/Copyright';
import { GridCellParams, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import apiClient from 'Services/apiService';

interface SparePartTransaction {
  sparePartTransactionId: number;
  partNumber: string;
  sparePartId: number;
  partName: string;
  manufacturer: string;
  price: number;
  qtyPrice: number;
  updateAt: string;
  transactionType: string;
  quantity: number;
  transactionDate: string;
  userId: number;
  billNo: string;
  vehicleRegId: string | null;
  customerName: string | null;
  name: string;
  totalGST: number | null;
  invoiceNumber: string | null;
  jobCardNumber: string | null;
  cgst: number | null;
  sgst: number | null;
}

interface ReportRow {
  id: number;
  invoiceNumber: string;
  invDate: string;
  totalQuantity: number;
  taxable: number;
  netTotal: number;
  transactions: SparePartTransaction[];
}

const PurchaseReport: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [allTransactions, setAllTransactions] = useState<SparePartTransaction[]>([]);
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    if (fromDate && toDate) {
      setLoading(true);
      try {
        const startDate = `${fromDate}T00:00:00`;
        const endDate = `${toDate}T23:59:59`;
        
        const response = await apiClient.get(
          `/sparePartTransactions/byTransactionTypeAndDateRange?transactionType=CREDIT&startDate=${startDate}&endDate=${endDate}`
        );
        
        if (response.data && Array.isArray(response.data.data)) {
          const transactions: SparePartTransaction[] = response.data.data;
          setAllTransactions(transactions);
          const groupedByBill: Record<string, SparePartTransaction[]> = {};
          
          transactions.forEach(transaction => {
            const billNo = transaction.billNo || 'Unknown';
            if (!groupedByBill[billNo]) {
              groupedByBill[billNo] = [];
            }
            groupedByBill[billNo].push(transaction);
          });
          const formattedRows = Object.entries(groupedByBill).map(([billNo, billTransactions], index) => {
            const firstTransaction = billTransactions[0];
            const totalQuantity = billTransactions.reduce((sum, t) => sum + t.quantity, 0);
            
            const subTotal = billTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0);
            
            const totalGST = billTransactions.reduce((sum, t) => {
              const itemSubtotal = t.price * t.quantity;
              const cgstRate = t.cgst || 0;
              const sgstRate = t.sgst || 0;
              const gstAmount = (cgstRate + sgstRate) * itemSubtotal / 100;
              return sum + gstAmount;
            }, 0);
            
            const netTotal = subTotal + totalGST;
            const transactionDate = new Date(firstTransaction.transactionDate);
            const formattedDate = transactionDate.toISOString().split('T')[0];
            
            console.log('Row data for bill', billNo, {
              subTotal,
              totalGST,
              netTotal
            });
            
            const row: ReportRow = {
              id: index + 1,
              invoiceNumber: billNo,
              invDate: formattedDate,
              totalQuantity,
              taxable: subTotal,
              netTotal: netTotal,
              transactions: billTransactions
            };
            return row;
        });
        setRows(formattedRows);
        } else {
          alert('Invalid response format from server');
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please select both dates.');
    }
  };

  // Add useEffect to trigger fetch when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchTransactions();
    }
  }, [fromDate, toDate]);

  const handlePrint = (billNo?: string) => {
    if (billNo) {
      const invoice = rows.find((row) => row.invoiceNumber === billNo);
      if (!invoice) return;
  
      const dataToSend = {
        fromDate,
        toDate,
        reportData: [invoice],
        transactions: invoice.transactions,
      };
      
      const query = encodeURIComponent(JSON.stringify(dataToSend));
      const url = `/admin/purchasereportPdf?data=${query}`;
    
      window.open(url, '_blank');
    } else {
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center; margin-bottom: 20px;">Purchase Report</h1>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <p><strong>From Date:</strong> ${fromDate}</p>
            <p><strong>To Date:</strong> ${toDate}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sr.No</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Invoice No</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Invoice Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total Quantity</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Taxable</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Net Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => {
                const hasGST = row.transactions.some(t => (t.cgst || 0) > 0 || (t.sgst || 0) > 0);
                const taxableValue = hasGST ? row.taxable : 0;
                
                return `
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="border: 1px solid #ddd; padding: 8px;">${row.id}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${row.invoiceNumber}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${row.invDate}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${row.totalQuantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₹${Number(taxableValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₹${Number(row.netTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                <td style="border: 1px solid #ddd; padding: 8px;" colspan="3">Total</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${rows.reduce((sum, row) => sum + row.totalQuantity, 0)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">₹${Number(rows.reduce((sum, row) => {
                  const hasGST = row.transactions.some(t => (t.cgst || 0) > 0 || (t.sgst || 0) > 0);
                  return sum + (hasGST ? row.taxable : 0);
                }, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">₹${Number(rows.reduce((sum, row) => sum + row.netTotal, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase Report</title>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  function renderActionButtons(params: GridCellParams) {
        return (
          <>
            <IconButton
              color="secondary"
          onClick={() => handlePrint(params.row.invoiceNumber)}
            >
              <Print />
            </IconButton>
          </>
        );
      }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Sr.No', flex: 1, minWidth: 100 },
    { field: 'invoiceNumber', headerName: 'Invoice No', flex: 1, minWidth: 150 },
    { field: 'invDate', headerName: 'Invoice Date', flex: 1, minWidth: 150 },
    { field: 'totalQuantity', headerName: 'Total Quantity', flex: 1, minWidth: 150 },
    { 
      field: 'taxable', 
      headerName: 'Taxable', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => {
        const hasGST = params.row.transactions.some((t: SparePartTransaction) => (t.cgst || 0) > 0 || (t.sgst || 0) > 0);
        const value = hasGST ? params.row.taxable : 0;
        
        return (
          <span>
            ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    { 
      field: 'netTotal', 
      headerName: 'Net Total', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => {
        const value = params.row.netTotal;
        return (
          <span>
            ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    { field: 'Action', headerName: 'Actions', flex: 1, minWidth: 150, renderCell: renderActionButtons },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '1700px' } }}>
      <Typography variant="h4" gutterBottom>
      Purchase Report
      </Typography>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <FormControl>
          <TextField
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            label="From Date"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </FormControl>
        <FormControl>
          <TextField
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            label="To Date"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </FormControl>
        {loading && <Typography>Loading...</Typography>}
      </Stack>
      {rows.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Debug info:</strong> Found {rows.length} rows. 
          First row data: {rows[0]?.invoiceNumber} - Taxable: {rows[0]?.taxable}, Net Total: {rows[0]?.netTotal}
        </div>
      )}
      <Grid container spacing={1} columns={12}>
      <Grid item xs={12}>
      <CustomizedDataGrid columns={columns} rows={rows} />
   </Grid>
         </Grid>

      {rows.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, boxShadow: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Quantity: {rows.reduce((sum, row) => sum + row.totalQuantity, 0)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Taxable: ₹{Number(rows.reduce((sum, row) => {
                  const hasGST = row.transactions.some(t => (t.cgst || 0) > 0 || (t.sgst || 0) > 0);
                  return sum + (hasGST ? row.taxable : 0);
                }, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Net: ₹{Number(rows.reduce((sum, row) => sum + row.netTotal, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

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
          onClick={() => handlePrint()}
        >
          Print All
    </button>
</div>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
};

export default PurchaseReport;