import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  CircularProgress
} from '@mui/material';
import apiClient from 'Services/apiService';
import storageUtils from '../../utils/storageUtils';

interface Vehicle {
  vehicleRegId: string;
  vehicleModel: string;
  chasisNo: string;
  engineNo: string;
  fuelType: string;
  numberPlateColor: string;
}

interface Customer {
  id: number;
  name: string;
  mobileNumber: string;
  address: string;
}

interface SpareItem {
  partName: string;
  quantity: number;
  rate: number;
  cgst: number;
  sgst: number;
  total: number;
}

interface ServiceItem {
  serviceName: string;
  quantity: number;
  rate: number;
  cgst: number;
  sgst: number;
  total: number;
}

interface ServiceEntry {
  date: string;
  kmDriven: number;
  spareItems: SpareItem[];
  serviceItems: ServiceItem[];
}

interface VehicleHistory {
  vehicle: Vehicle;
  customer: Customer;
  serviceEntries: ServiceEntry[];
}

const VehicalHistoryWithPDF: React.FC = () => {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory | null>(null);

  const fetchVehicleHistory = async () => {
    if (!vehicleId.trim()) {
      alert('Please enter a vehicle number');
      return;
    }
    
    setLoading(true);
    console.log(`Attempting to fetch data for vehicle: ${vehicleId}`);
    
    try {
      const token = storageUtils.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const apiUrl = `/api/vehicle-invoices/search/vehicle-no/${encodeURIComponent(vehicleId)}`;
      console.log(`Making API request to: ${apiUrl}`);
      
      const response = await apiClient.get(apiUrl, config);
      console.log('API Response:', response);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('Transforming API data:', response.data);
        
        const regNo = response.data[0].regNo;
        
        try {
          const vehicleDetailsUrl = `https://carauto01-production-8b0b.up.railway.app/vehicle-reg/details/${encodeURIComponent(regNo)}`;
          console.log(`Fetching vehicle details from: ${vehicleDetailsUrl}`);
          
          const vehicleDetailsResponse = await apiClient.get(vehicleDetailsUrl, config);
          console.log('Vehicle Details Response:', vehicleDetailsResponse);
          
          const history = transformApiData(response.data, vehicleDetailsResponse.data);
          setVehicleHistory(history);
          console.log('Vehicle history set:', history);
        } catch (detailsError) {
          console.error('Error fetching vehicle details:', detailsError);
          const history = transformApiData(response.data);
          setVehicleHistory(history);
        }
      } else {
        console.error('API returned empty data');
        alert('No data found for this vehicle');
      }
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      alert(`Failed to fetch vehicle history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      fetchVehicleHistory();
    }
  };

  const transformApiData = (apiData: any, vehicleDetails?: any): VehicleHistory => {
    
    const invoices = Array.isArray(apiData) ? apiData : [];
    
    if (invoices.length === 0) {
      return {
        vehicle: {
          vehicleRegId: '',
          vehicleModel: '',
          chasisNo: '',
          engineNo: '',
          fuelType: '',
          numberPlateColor: ''
        },
        customer: {
          id: 0,
          name: '',
          mobileNumber: '',
          address: ''
        },
        serviceEntries: []
      };
    }
    const firstInvoice = invoices[0];
    const vehicle: Vehicle = {
      vehicleRegId: firstInvoice.regNo || '',
      vehicleModel: firstInvoice.model || '',
      chasisNo: vehicleDetails?.chasisNumber || '',
      engineNo: vehicleDetails?.engineNumber || '',
      fuelType: vehicleDetails?.vehicleVariant || '',
      numberPlateColor: vehicleDetails?.numberPlateColour || ''
    };

    const customer: Customer = {
      id: 0, 
      name: firstInvoice.customerName || '',
      mobileNumber: firstInvoice.customerMobile || '',
      address: firstInvoice.customerAddress || ''
    };

    const serviceEntries: ServiceEntry[] = invoices.map((invoice: any) => {
      
      const spareItems: SpareItem[] = (invoice.parts || []).map((part: any) => ({
        partName: part.partName || '',
        quantity: part.quantity || 0,
        rate: part.unitPrice || 0,
        cgst: part.cgstAmount || 0,
        sgst: part.sgstAmount || 0,
        total: part.totalAmount || 0
      }));

      const serviceItems: ServiceItem[] = (invoice.labours || []).filter((labour: any) => 
        labour.description && labour.description.trim() !== ''
      ).map((labour: any) => ({
        serviceName: labour.description || '',
        quantity: labour.quantity || 0,
        rate: labour.unitPrice || 0,
        cgst: labour.cgstAmount || 0,
        sgst: labour.sgstAmount || 0,
        total: labour.totalAmount || 0
      }));

      return {
        date: invoice.invoiceDate || '',
        kmDriven: parseInt(invoice.kmsDriven || '0', 10),
        spareItems,
        serviceItems
      };
    });

    console.log('Transformed data:', { vehicle, customer, serviceEntries });
    return { vehicle, customer, serviceEntries };
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Vehicle History: ${vehicleHistory?.vehicle.vehicleRegId || ''}</title>
              <style>
                @page {
                  size: A4;
                  margin: 2cm 1.5cm;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  margin: 0;
                  padding: 12px;
                  background-color: white;
                }
                .print-container {
                  width: 100%;
                  max-width: 95%;
                  margin: 0 auto;
                  padding: 10px 0;
                }
                table {
                  width: 100%;
                  table-layout: fixed;
                  border-collapse: collapse;
                  margin-bottom: 15px;
                  border: 1px solid #000;
                }
                tr {
                  page-break-inside: avoid;
                }
                td, th {
                  padding: 4px 5px;
                  font-size: 10px;
                  border: 1px solid #000;
                  overflow: hidden;
                  word-wrap: break-word;
                }
                th, .header-cell {
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
                td[align="right"] {
                  text-align: right;
                }
                td[align="center"] {
                  text-align: center;
                }
                h6 {
                  font-size: 14px;
                  font-weight: bold;
                  text-align: center;
                  background-color: #f5f5f5;
                  padding: 6px;
                  margin: 10px 0;
                  border: 1px solid #000;
                }
                .sr-col { width: 7%; }
                .name-col { width: 36%; }
                .qty-col { width: 8%; text-align: center; }
                .price-col { width: 12.25%; text-align: right; }
                .date-row {
                  font-weight: bold;
                  background-color: #f5f5f5;
                }
                .total-row {
                  font-weight: bold;
                  background-color: #f8f8f8;
                }
                .section-title {
                  margin: 20px 0 10px 0;
                  padding: 8px;
                  text-align: center;
                  background-color: #f5f5f5;
                  border: 1px solid #000;
                  font-weight: bold;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                ${printContent.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  // Wait a moment for styles to apply before printing
                  setTimeout(function() {
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    };
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      console.error("Print content not found");
      window.print();
    }
  };

  const calculateSpareTotal = () => {
    if (!vehicleHistory) return { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 };
    
    return vehicleHistory.serviceEntries.reduce(
      (acc, entry) => {
        const entryTotals = entry.spareItems.reduce(
          (subAcc, item) => ({
            qty: subAcc.qty + item.quantity,
            rate: subAcc.rate + (item.rate * item.quantity),
            cgst: subAcc.cgst + item.cgst,
            sgst: subAcc.sgst + item.sgst,
            total: subAcc.total + item.total
          }),
          { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 }
        );
        
        return {
          qty: acc.qty + entryTotals.qty,
          rate: acc.rate + entryTotals.rate,
          cgst: acc.cgst + entryTotals.cgst,
          sgst: acc.sgst + entryTotals.sgst,
          total: acc.total + entryTotals.total
        };
      },
      { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 }
    );
  };

  const calculateServiceTotal = () => {
    if (!vehicleHistory) return { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 };
    
    return vehicleHistory.serviceEntries.reduce(
      (acc, entry) => {
        const entryTotals = entry.serviceItems.reduce(
          (subAcc, item) => ({
            qty: subAcc.qty + item.quantity,
            rate: subAcc.rate + (item.rate * item.quantity),
            cgst: subAcc.cgst + item.cgst,
            sgst: subAcc.sgst + item.sgst,
            total: subAcc.total + item.total
          }),
          { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 }
        );
        
        return {
          qty: acc.qty + entryTotals.qty,
          rate: acc.rate + entryTotals.rate,
          cgst: acc.cgst + entryTotals.cgst,
          sgst: acc.sgst + entryTotals.sgst,
          total: acc.total + entryTotals.total
        };
      },
      { qty: 0, rate: 0, cgst: 0, sgst: 0, total: 0 }
    );
  };

  const spareTotals = calculateSpareTotal();
  const serviceTotals = calculateServiceTotal();

  if (!vehicleHistory) {
    return (
      <Box sx={{ p: 3, maxWidth: '100%', overflowX: 'auto' }} className="print-container">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '120px' }}>
            Vehicle No*
          </Typography>
          <TextField
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Vehicle No"
            sx={{ minWidth: 250 }}
          />
        </Box>

        <Grid container spacing={0}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, border: '1px solid #ddd' }}>
              <Typography variant="h6" gutterBottom sx={{ bgcolor: '#f5f5f5', p: 1 }}>
                VEHICLE DETAILS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ width: '50%', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      VEHICLE NO:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      VEHICLE MODEL:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      CHASIS NO:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      ENGINE NO:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      FUEL TYPE:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      NUMBER PLATE COLOR:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
          <Grid item xs={6}>
            <Paper sx={{ p: 2, border: '1px solid #ddd', borderLeft: 'none' }}>
              <Typography variant="h6" gutterBottom sx={{ bgcolor: '#f5f5f5', p: 1 }}>
                CUSTOMER DETAILS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ width: '50%', fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      CUSTOMER NAME:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      CUSTOMER ADDRESS:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>
                      CUSTOMER MOBILE:
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, border: '1px solid #ddd' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center', 
              bgcolor: '#f5f5f5', 
              p: 1, 
              borderBottom: '1px solid #ddd',
              fontWeight: 'bold'
            }}
          >
            *******************SPARE DETAILS*******************
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SR.No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SPARE NAME</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>RATE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>CGST AMT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SGST AMT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ mt: 3, border: '1px solid #ddd' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center', 
              bgcolor: '#f5f5f5', 
              p: 1, 
              borderBottom: '1px solid #ddd',
              fontWeight: 'bold'
            }}
          >
            *******************SERVICE DETAILS*******************
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SR.No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SERVICE NAME</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>RATE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>CGST AMT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>SGST AMT</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            onClick={fetchVehicleHistory}
            disabled={!vehicleId.trim() || loading}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '5px',
              padding: '10px 30px',
              bgcolor: '#60B5FF',
              mr: 2,
              '&:hover': {
                bgcolor: '#AFDDFF',
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%', overflowX: 'auto' }} className="print-container">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }} className="no-print">
        <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '120px' }}>
          Vehicle No*
        </Typography>
        <TextField
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Vehicle No"
          sx={{ minWidth: 250 }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => {
            console.log('Search button clicked');
            fetchVehicleHistory();
          }}
          disabled={!vehicleId.trim() || loading}
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>

      <div id="printable-content" style={{ width: '100%', margin: '0 auto' }}>
        <Grid container spacing={0}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, border: '1px solid #000' }}>
              <Typography variant="h6" gutterBottom sx={{ bgcolor: '#f5f5f5', p: 1, fontSize: '14px', textAlign: 'center' }}>
                VEHICLE DETAILS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ width: '50%', fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      VEHICLE NO:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.vehicleRegId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      VEHICLE MODEL:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.vehicleModel}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      CHASIS NO:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.chasisNo}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      ENGINE NO:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.engineNo}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      FUEL TYPE:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.fuelType}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      NUMBER PLATE COLOR:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.vehicle.numberPlateColor}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          
          <Grid item xs={6}>
            <Paper sx={{ p: 2, border: '1px solid #000', borderLeft: 'none' }}>
              <Typography variant="h6" gutterBottom sx={{ bgcolor: '#f5f5f5', p: 1, fontSize: '14px', textAlign: 'center' }}>
                CUSTOMER DETAILS
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ width: '50%', fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      CUSTOMER NAME:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.customer.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      CUSTOMER ADDRESS:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.customer.address}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}>
                      CUSTOMER MOBILE:
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>{vehicleHistory.customer.mobileNumber}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderRight: '1px solid #000', border: '1px solid #000' }}></TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 3, border: '1px solid #000' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center', 
              bgcolor: '#f5f5f5', 
              p: 1, 
              borderBottom: '1px solid #000',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
            className="section-title"
          >
            *******************SPARE DETAILS*******************
          </Typography>
          
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell className="sr-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '7%' }}>SR.No</TableCell>
                  <TableCell className="name-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '36%' }}>SPARE NAME</TableCell>
                  <TableCell className="qty-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '8%', textAlign: 'center' }}>QTY</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>RATE</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>CGST AMT</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>SGST AMT</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleHistory.serviceEntries.map((entry, entryIndex) => (
                  <React.Fragment key={`spare-entry-${entryIndex}`}>
                    <TableRow className="date-row">
                      <TableCell colSpan={7} sx={{ fontWeight: 'bold', border: '1px solid #000', bgcolor: '#f5f5f5' }}>
                        {entryIndex + 1}. DATE: {entry.date} | KILOMETER DRIVEN : {entry.kmDriven}
                      </TableCell>
                    </TableRow>
                    
                    {entry.spareItems.map((item, itemIndex) => (
                      <TableRow key={`spare-item-${entryIndex}-${itemIndex}`}>
                        <TableCell sx={{ border: '1px solid #000' }}>{itemIndex + 1}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.partName}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{item.quantity}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.rate.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.cgst.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.sgst.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                
                <TableRow className="total-row">
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right', border: '1px solid #000', bgcolor: '#f8f8f8' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', bgcolor: '#f8f8f8' }}>{spareTotals.qty}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{spareTotals.rate.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{spareTotals.cgst.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{spareTotals.sgst.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{spareTotals.total.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Paper sx={{ mt: 3, border: '1px solid #000' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center', 
              bgcolor: '#f5f5f5', 
              p: 1, 
              borderBottom: '1px solid #000',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
            className="section-title"
          >
            *******************SERVICE DETAILS*******************
          </Typography>
          
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell className="sr-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '7%' }}>SR.No</TableCell>
                  <TableCell className="name-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '36%' }}>SERVICE NAME</TableCell>
                  <TableCell className="qty-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '8%', textAlign: 'center' }}>QTY</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>RATE</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>CGST AMT</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>SGST AMT</TableCell>
                  <TableCell className="price-col" sx={{ fontWeight: 'bold', border: '1px solid #000', width: '12.25%', textAlign: 'right' }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleHistory.serviceEntries.map((entry, entryIndex) => (
                  <React.Fragment key={`service-entry-${entryIndex}`}>
                    <TableRow className="date-row">
                      <TableCell colSpan={7} sx={{ fontWeight: 'bold', border: '1px solid #000', bgcolor: '#f5f5f5' }}>
                        {entryIndex + 1}. DATE: {entry.date} | KILOMETER DRIVEN : {entry.kmDriven}
                      </TableCell>
                    </TableRow>
                    
                    {entry.serviceItems.map((item, itemIndex) => (
                      <TableRow key={`service-item-${entryIndex}-${itemIndex}`}>
                        <TableCell sx={{ border: '1px solid #000' }}>{itemIndex + 1}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.serviceName}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{item.quantity}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.rate.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.cgst.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.sgst.toFixed(2)}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                
                <TableRow className="total-row">
                  <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right', border: '1px solid #000', bgcolor: '#f8f8f8' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'center', bgcolor: '#f8f8f8' }}>{serviceTotals.qty}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{serviceTotals.rate.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{serviceTotals.cgst.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{serviceTotals.sgst.toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #000', textAlign: 'right', bgcolor: '#f8f8f8' }}>{serviceTotals.total.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>

      <Box sx={{ textAlign: 'center', mt: 3 }} className="no-print">
        <Button
          onClick={handlePrint}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: '5px',
            padding: '10px 30px',
            bgcolor: '#60B5FF',
            '&:hover': {
              bgcolor: '#AFDDFF',
            },
          }}
        >
          Print
        </Button>
      </Box>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default VehicalHistoryWithPDF;
//////