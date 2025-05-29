import React, { FC, useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
// import { InvoiceFormData } from './InvoiceFormData';
import { Box, Button, CircularProgress, Container, Snackbar, Alert, Typography } from '@mui/material';
import apiClient from 'Services/apiService';

interface BillRow {
  id?: number;
  sNo: number;
  spareNo: string;
  spareName: string;
  qty?: number;
  rate: number;
  discountPercent: number;
  discountAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  taxable?: number;
  total?: number;
  quantity?: number;
  amount?: number;
}

interface LocationState {
//   invoiceData: InvoiceFormData;
  invoiceNumber: string;
  jobCardNumber: string;
  invDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  adharNo: string;
  gstin: string;
  vehicleNo: string;
  items?: BillRow[];
  billRows?: BillRow[];
  vehicleRegId: string;
  customerAadharNo: string;
  customerGstin: string;
  transactionDate: string;
  regNo: string;
  model: string;
  kmsDriven: string;
  comments: string;
  parts: {
    partName: string;
    quantity: string; 
    unitPrice: string;
    discountPercent: string;
    cgstPercent: string;
    sgstPercent: string;
    igstPercent: string;
  }[];
  labours: {
    description: string;
    quantity: string;
    unitPrice: string;
    discountPercent: string;
    cgstPercent: string;
    sgstPercent: string;
    igstPercent: string;
  }[];
  globalDiscount : number;
  subTotal: number;
  partsSubtotal:number;
  laboursSubtotal:number;
  totalAmount: number;
  advanceAmount: string;
  totalInWords: string;
}


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

// Add print-specific styles to the document head
const addPrintStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.setAttribute('id', 'print-styles');
  styleElement.innerHTML = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
      }
      body * {
        visibility: hidden;
      }
      .print-content, .print-content * {
        visibility: visible;
      }
      .print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        page-break-after: avoid;
        page-break-inside: avoid;
        box-sizing: border-box;
      }
      .no-print {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(styleElement);
  return () => {
    const existingStyle = document.getElementById('print-styles');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
  };
};

const QuotationPDFGeneration: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null); 

  // Add print styles when component mounts
  useEffect(() => {
    const removePrintStyles = addPrintStyles();
    return () => {
      removePrintStyles();
    };
  }, []);

  // Fetch quotation data
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/quotations/${id}`);
        setQuotation(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching quotation:', error);
        setError('Failed to load quotation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);
  
  // Auto-generate PDF when data is loaded
  useEffect(() => {
    if (quotation && !generating && invoiceRef.current) {
      generatePDF();
    }
  }, [quotation, invoiceRef.current]);

  // Handle manual print
  const handlePrint = () => {
    window.print();
  };

  // Compute totals with memoization for better performance
  const computeTotals = useCallback(() => {
    if (!quotation) return { 
      partsTotals: [], 
      laboursTotals: [], 
      partsSubtotal: 0, 
      laboursSubtotal: 0, 
      subTotal: 0, 
      totalAmount: 0 
    };

    const computeItemTotal = (item: PartLine | LabourLine) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPercent = Number(item.discountPercent) || 0;

        const baseAmount = quantity * unitPrice;
        const discount = (baseAmount * discountPercent) / 100;
        const taxableAmount = baseAmount - discount;

      return { total: taxableAmount, discount, baseAmount };
    };

    const partLines = quotation.partLines || [];
    const labourLines = quotation.labourLines || [];

    const partsTotals = partLines.map(computeItemTotal);
    const laboursTotals = labourLines.map(computeItemTotal);

    const partsSubtotal = partsTotals.reduce((acc: number, item) => acc + item.total, 0);
    const laboursSubtotal = laboursTotals.reduce((acc: number, item) => acc + item.total, 0);
    const subTotal = partsSubtotal + laboursSubtotal;
    const totalAmount = subTotal;

    return { partsTotals, laboursTotals, partsSubtotal, laboursSubtotal, subTotal, totalAmount };
  }, [quotation]);

  // Memoize the totals calculation
  const totals = useMemo(() => computeTotals(), [computeTotals]);

  // Generate PDF function
  const generatePDF = async () => {
    if (!invoiceRef.current) {
      setError("Could not generate PDF. Please try again.");
      return;
    }

    try {
      setGenerating(true);

      // Optimize PDF generation
      const options = { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for better performance
      };
      
      const canvas = await html2canvas(invoiceRef.current, options as any);
      const imgData = canvas.toDataURL("image/png", 0.7); // Compress image

    const pageWidth = 210; 
    const pageHeight = 297; 
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width; 
      const scaleFactor = imgHeight > pageHeight ? pageHeight / imgHeight : 1;
      const finalHeight = imgHeight * scaleFactor;

    const pdf = new jsPDF({
        orientation: "portrait",
      unit: "mm",
      format: "a4",
        compress: true,
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
      pdf.save(`quotation-${quotation?.quotationNumber || id}.pdf`);
      setSuccess("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Number to words conversion
  const numberToWords = (num: number): string => {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    return convert(num);
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh" className="no-print">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={3}>Loading quotation data...</Typography>
      </Box>
    );
  }

  // Error state
  if (error && !quotation) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh" className="no-print">
        <Typography variant="h6" color="error">{error}</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)} sx={{ mt: 3 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  // No data state
  if (!quotation) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh" className="no-print">
        <Typography variant="h6" color="error">No quotation data found</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)} sx={{ mt: 3 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
    <div
      ref={invoiceRef}
       id="invoice-container"
        className="print-content"
      style={{
        width: '100%',
          minHeight: 'auto',
        margin: '0 auto',
        padding: '5mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.6rem',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          pageBreakAfter: 'avoid',
          pageBreakInside: 'avoid',
      }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                textAlign: 'center',
                verticalAlign: 'top',
                width: '70%',
              }}>
              <h2 style={{ margin: 0, fontWeight: 'bold' }}>AUTO CAR CARE POINT</h2>
              <p style={{ margin: 0 }}>
                Buvasaheb Nagar, Shingnapur Road, Kolki, Tal.Phaltan(415523), Dist.Satara.
              </p>
              <p style={{ margin: 0 }}>
                Ph : 9595054555 / 7758817766   Email : autocarcarepoint@gmail.com
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>GSTIN : 27GLYPS9891C1ZV</p>
            </td>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                textAlign: 'center',
                verticalAlign: 'middle',
                width: '30%',
              }}
            >
              <strong style={{ fontSize: '1.2rem' }}>QUOTATION</strong>
            </td>
          </tr>
         <tr>
  <td colSpan={2} style={{ padding: '0' }}>
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ width: '50%', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
        CUSTOMER DETAILS
      </div>
      <div style={{ width: '50%', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
        QUOTATION DETAILS
      </div>
    </div>
  </td>
</tr>

           <tr>
              <td colSpan={2} style={{ padding: '0' }}>
               <div style={{ display: 'flex', width: '100%' }}>
               <div style={{ width: '50%', border: '1px solid #000', padding: '6px', }}>
              <p style={{ margin: 0 }}>Name: {quotation.customerName || "NA"}</p>
              <p style={{ margin: 0 }}>Address: {quotation.customerAddress || "NA"}</p>
              <p style={{ margin: 0 }}>Mobile: {quotation.customerMobile || "NA"}</p>
              <p style={{ margin: 0 }}>Email: {quotation.customerEmail || "NA"}</p>
              </div>
              <div style={{ width: '50%', border: '1px solid #000', padding: '6px',}}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              <div>
              <p style={{ margin: 0, textAlign: 'left' }}>
              Quotation No : {quotation.quotationNumber || "NA"}
              </p>
              <p style={{ margin: 0, textAlign: 'left' }}>
              Quotation Date : {quotation.quotationDate || "NA"}
              </p>
              <p style={{ margin: 0, textAlign: 'left' }}>
              Vehicle No : {quotation.vehicleNumber || "NA"}
              </p>
              </div>
              </div>
              </div>
              </div>
            </td>
          </tr> 

          <tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <strong>SPARES / ITEMS</strong>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
          <tr>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
            S.No
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
            Particulars Of Parts
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
            Qty
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Rate
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Disc%
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Amount
          </td>
        </tr>
                </thead>
                <tbody>
                    {quotation.partLines && quotation.partLines.map((part, index) => (
                      <tr key={`part-${part.id || index}`}>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {index + 1}
                        </td>
                        <td style={{ border: '1px solid grey', padding: '4px' }}>
                          {part.partName}
                        </td>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {part.quantity}
                        </td>
                        <td style={{ border: '1px solid grey', textAlign: 'right', padding: '4px' }}>
                          {part.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {part.discountPercent}%
                        </td>
                        <td style={{ border: '1px solid grey', textAlign: 'right', padding: '4px' }}>
                          {part.finalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </td>
          </tr>

<tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                <strong>LABOUR CHARGES</strong>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
          <tr>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
            S.No
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Description
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
            Qty
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Rate
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
                        Disc%
          </td>
                      <td style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      }}>
           Amount
          </td>
        </tr>
                </thead>
                <tbody>
                    {quotation.labourLines && quotation.labourLines.map((labour, index) => (
                      <tr key={`labour-${labour.id || index}`}>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {index + 1}
                        </td>
                        <td style={{ border: '1px solid grey', padding: '4px' }}>
                          {labour.name}
                        </td>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {labour.quantity}
                    </td>
                        <td style={{ border: '1px solid grey', textAlign: 'right', padding: '4px' }}>
                          {labour.unitPrice.toFixed(2)}
                    </td>
                        <td style={{ border: '1px solid grey', textAlign: 'center', padding: '4px' }}>
                          {labour.discountPercent}%
                    </td>
                        <td style={{ border: '1px solid grey', textAlign: 'right', padding: '4px' }}>
                          {labour.finalAmount.toFixed(2)}
                    </td>
                  </tr> 
                    ))}
                  </tbody>
              </table>
            </td>
          </tr>

          <tr>
              <td colSpan={2} style={{ padding: 0 }}>
                <div style={{ display: 'flex', width: '100%' }}>
                  <div style={{ width: '60%', border: '1px solid #000', padding: '6px' }}>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>Amount in words:</strong> {numberToWords(Math.round(totals.totalAmount))} Rupees Only
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>Terms & Conditions:</strong>
                    </p>
                    <ol style={{ margin: '0 0 0 15px', padding: 0 }}>
                      <li>Validity: This quotation is valid for 15 days from the date of issue.</li>
                      <li>Payment: 100% advance payment required before work commencement.</li>
                      <li>Taxes: All applicable taxes are included in the quoted price.</li>
                    </ol>
                  </div>
                  <div style={{ width: '40%', border: '1px solid #000', padding: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                          <td style={{ padding: '4px 0', textAlign: 'left' }}>Parts Subtotal:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right' }}>₹ {totals.partsSubtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', textAlign: 'left' }}>Labour Subtotal:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right' }}>₹ {totals.laboursSubtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0', textAlign: 'left', fontWeight: 'bold' }}>Total Amount:</td>
                          <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>₹ {totals.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
                  </div>
                </div>
            </td>
          </tr>

          <tr>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 30px 0' }}>For AUTO CAR CARE POINT</p>
                <p style={{ margin: 0 }}>Authorized Signatory</p>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <Box display="flex" justifyContent="center" mt={4} className="no-print">
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handlePrint}
          sx={{ mr: 2 }}
          disabled={generating}
        >
          Print
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
          disabled={generating}
        >
          Back to List
        </Button>
      </Box>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="no-print"
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="no-print"
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const tableBodyCell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

export default React.memo(QuotationPDFGeneration);