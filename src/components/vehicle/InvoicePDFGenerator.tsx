
import React, { FC, useRef, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceFormData } from './InvoiceFormData';
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
  invoiceData?: any; // Make this property optional
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

const CounterBillPDF: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const invoiceNumber = searchParams.get('invoiceNumber');
  const [invoiceData, setInvoiceData] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      const vehicleRegId = searchParams.get('vehicleRegId');
      
      if (invoiceNumber) {
        // Fetch by invoice number
        try {
          setIsLoading(true);
          const response = await apiClient.get(`/api/vehicle-invoices/search/invoice/${invoiceNumber}`);
          console.log('Fetched invoice data by invoice number:', response.data);
          
          if (response.data) {
            // Transform API response to match the LocationState structure
            const invoice = response.data;
            setInvoiceData({
              invoiceData: invoice,
              invoiceNumber: invoice.invoiceNumber,
              jobCardNumber: invoice.jobCardNumber || '',
              invDate: invoice.invoiceDate || '',
              transactionDate: invoice.invoiceDate || '',
              customerName: invoice.customerName || '',
              customerAddress: invoice.customerAddress || '',
              customerMobile: invoice.customerMobile || '',
              adharNo: invoice.customerAadharNo || '',
              gstin: invoice.customerGstin || '',
              vehicleNo: invoice.vehicleNo || '',
              vehicleRegId: invoice.vehicleRegId || '',
              customerAadharNo: invoice.customerAadharNo || '',
              customerGstin: invoice.customerGstin || '',
              regNo: invoice.regNo || '',
              model: invoice.model || '',
              kmsDriven: invoice.kmsDriven || '',
              comments: invoice.comments || '',
              parts: invoice.parts || [],
              labours: invoice.labours || [],
              globalDiscount: invoice.globalDiscount || 0,
              subTotal: invoice.subTotal || 0,
              partsSubtotal: invoice.partsSubtotal || 0,
              laboursSubtotal: invoice.laboursSubtotal || 0,
              totalAmount: invoice.totalAmount || 0,
              advanceAmount: invoice.advanceAmount || '0',
              totalInWords: invoice.totalInWords || '',
              billRows: [],
              items: []
            });
          }
        } catch (error) {
          console.error('Error fetching invoice data by invoice number:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (vehicleRegId) {
        // Fetch by vehicle registration ID
        try {
          setIsLoading(true);
          const response = await apiClient.get(`/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`);
          console.log('Fetched invoice data by vehicle ID:', response.data);
          
          if (response.data && response.data.length > 0) {
            // Use the most recent invoice if multiple exist
            const invoice = Array.isArray(response.data) ? response.data[0] : response.data;
            
            setInvoiceData({
              invoiceData: invoice,
              invoiceNumber: invoice.invoiceNumber,
              jobCardNumber: invoice.jobCardNumber || '',
              invDate: invoice.invoiceDate || '',
              transactionDate: invoice.invoiceDate || '',
              customerName: invoice.customerName || '',
              customerAddress: invoice.customerAddress || '',
              customerMobile: invoice.customerMobile || '',
              adharNo: invoice.customerAadharNo || '',
              gstin: invoice.customerGstin || '',
              vehicleNo: invoice.vehicleNo || '',
              vehicleRegId: invoice.vehicleRegId || '',
              customerAadharNo: invoice.customerAadharNo || '',
              customerGstin: invoice.customerGstin || '',
              regNo: invoice.regNo || '',
              model: invoice.model || '',
              kmsDriven: invoice.kmsDriven || '',
              comments: invoice.comments || '',
              parts: invoice.parts || [],
              labours: invoice.labours || [],
              globalDiscount: invoice.globalDiscount || 0,
              subTotal: invoice.subTotal || 0,
              partsSubtotal: invoice.partsSubtotal || 0,
              laboursSubtotal: invoice.laboursSubtotal || 0,
              totalAmount: invoice.totalAmount || 0,
              advanceAmount: invoice.advanceAmount || '0',
              totalInWords: invoice.totalInWords || '',
              billRows: [],
              items: []
            });
          }
        } catch (error) {
          console.error('Error fetching invoice data by vehicle ID:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (location.state) {
        // If we have location state, use it directly
        setInvoiceData(location.state as LocationState);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceNumber, searchParams, location.state]);

  const invoiceRef = useRef<HTMLDivElement>(null); 

  const generatePDF = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 190; 
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('invoice.pdf');
    }
  };
  const numberToWords = (num: number): string => {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
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

  if (isLoading) {
    return <div>Loading invoice data...</div>;
  }

  if (!invoiceData) {
    return <div>No invoice data found. Please check the invoice number and try again.</div>;
  }

  return (
    <div
      ref={invoiceRef} 
      style={{
        width: '100%',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '5mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.9rem',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
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
              <strong style={{ fontSize: '1.2rem' }}>TAX INVOICE</strong>
              {invoiceData.invoiceNumber && (
                <p style={{ margin: '5px 0 0 0' }}>
                  <strong>Invoice No:</strong> {invoiceData.invoiceNumber}
                </p>
              )}
              {invoiceData.transactionDate && (
                <p style={{ margin: '5px 0 0 0' }}>
                  <strong>Invoice Date:</strong> {new Date(invoiceData.transactionDate).toLocaleDateString('en-GB')}
                </p>
              )}
              {invoiceData.jobCardNumber && (
                <p style={{ margin: '5px 0 0 0' }}>
                  <strong>Job Card No:</strong> {invoiceData.jobCardNumber}
                </p>
              )}
            </td>
          </tr>
          <tr>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                fontWeight: 'bold',
                verticalAlign: 'top',
                width: '50%',
              }}
            >
              CUSTOMER DETAILS
            </td>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                fontWeight: 'bold',
                textAlign: 'right',
                verticalAlign: 'top',
                width: '50%',
              }}
            >
              VEHICLE DETAILS
            </td>
          </tr>

          <tr>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                verticalAlign: 'top',
                width: '50%',
              }}
            >
              <p style={{ margin: 0 }}>Name: {invoiceData.customerName}</p>
              <p style={{ margin: 0 }}>Address: {invoiceData.customerAddress}</p>
              <p style={{ margin: 0 }}>Mobile: {invoiceData.customerMobile}</p>
              <p style={{ margin: 0 }}>Vehicle No: {invoiceData.vehicleRegId}</p>
              {invoiceData.customerAadharNo && <p style={{ margin: 0 }}>Aadhaar No: {invoiceData.customerAadharNo}</p>}
              {invoiceData.customerGstin && <p style={{ margin: 0 }}>GSTIN: {invoiceData.customerGstin}</p>}
            </td>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                verticalAlign: 'top',
                width: '50%',
              }}
            >
              <p style={{ margin: 0, textAlign: 'left' }}>
                    Invoice No: {invoiceData.invoiceNumber}
                  </p>
              <p style={{ margin: 0, textAlign: 'left' }}>
                Invoice Date: {invoiceData.transactionDate}
              </p>
              <p style={{ margin: 0, textAlign: 'left' }}>
                    Jobcard No: {invoiceData.jobCardNumber}
                  </p>
              <p style={{ margin: 0, textAlign: 'left' }}>
                Reg No: {invoiceData.regNo}
              </p><p style={{ margin: 0, textAlign: 'left' }}>
                Engine No: {invoiceData.vehicleNo}
              </p><p style={{ margin: 0, textAlign: 'left' }}>
                KMs Driven: {invoiceData.kmsDriven}
              </p><p style={{ margin: 0, textAlign: 'left' }}>
                Model: {invoiceData.model}
              </p>
             
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
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            S.No
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Particulars Of Parts
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Qty
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Unit <br /> Price
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Discount
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Taxable <br /> Amt
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            CGST
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            SGST
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            IGST
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Amount
          </td>
        </tr>

        <tr>
          <td colSpan={4}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#fff',
              color: theme.palette.mode === 'dark' ? '#ddd' : '#000',
            }}
          ></td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          ></td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          ></td>
        </tr>
                </thead>
                <tbody>
                  {invoiceData.parts.map((part, index) => {
                    const quantity = Number(part.quantity) || 0;
                    const unitPrice = Number(part.unitPrice) || 0;
                    const globalDiscountPercent = invoiceData.globalDiscount || 0;
                    const discountPercent = globalDiscountPercent > 0 ? globalDiscountPercent : Number(part.discountPercent) || 0;
                    const base = quantity * unitPrice;
                    const discount = base * discountPercent / 100;
                    const taxableAmount = base - discount;
                    const cgstPercent=Number(part.cgstPercent)
                    const sgstPercent=Number(part.sgstPercent)
                    const igstPercent=Number(part.igstPercent)
                    const cgst = (taxableAmount *Number(part.cgstPercent)) / 100;
                    const sgst = (taxableAmount *Number(part.sgstPercent)) / 100;
                    const igst = (taxableAmount *Number(part.igstPercent)) / 100;
                    const amount = taxableAmount;
                    return (
                      <tr key={index}>
                        <td style={tableBodyCell}>{index + 1}</td>
                        <td style={tableBodyCell}>{part.partName}</td>
                        <td style={tableBodyCell}>{quantity}</td>
                        <td style={tableBodyCell}>{unitPrice.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discountPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgst.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{sgst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{sgstPercent.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{igst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{igstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={13} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      SUB TOTAL
                    </td>
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                    {invoiceData?.partsSubtotal?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>
<tr>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
              <strong>LABOUR WORK</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
          <tr>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            S.No
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Particulars Of Services
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Qty
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Unit <br /> Price
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Discount
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Taxable <br /> Amt
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            CGST
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            SGST
          </td>
          <td 
            colSpan={2}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            IGST
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            Amount
          </td>
        </tr>

        <tr>
          <td colSpan={4}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#fff',
              color: theme.palette.mode === 'dark' ? '#ddd' : '#000',
            }}
          ></td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          ></td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            %
          </td>
          <td colSpan={1}
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Amt
          </td>
          <td 
            style={{
              border: '1px solid grey',
              textAlign: 'center',
              padding: '8px',
            }}
          ></td>
        </tr>
          
                </thead>
                <tbody>
                  {invoiceData.labours.map((part, index) => {        
                    const quantity = Number(part.quantity) || 0;
                    const unitPrice = Number(part.unitPrice) || 0;
                    const globalDiscountPercent = invoiceData.globalDiscount || 0;
                    const discountPercent = globalDiscountPercent > 0 ? globalDiscountPercent : Number(part.discountPercent) || 0;
                    const base = quantity * unitPrice;
                    const discount = base * discountPercent / 100;
                    const taxableAmount = base - discount;

                    const cgstPercent=Number(part.cgstPercent)
                    const sgstPercent=Number(part.sgstPercent)
                    const igstPercent=Number(part.igstPercent)

                    const cgst = (taxableAmount *Number(part.cgstPercent)) / 100;
                    const sgst = (taxableAmount *Number(part.sgstPercent)) / 100;
                    const igst = (taxableAmount *Number(part.igstPercent)) / 100;
                    console.log(sgst,cgst,igst)
                    const amount = taxableAmount;
                    return (
                      <tr key={index}>
                        <td style={tableBodyCell}>{index + 1}</td>
                        <td style={tableBodyCell}>{part.description}</td>
                        <td style={tableBodyCell}>{quantity}</td>
                        <td style={tableBodyCell}>{unitPrice.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discountPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgst.toFixed(2)}</td>   
                        <td style={tableBodyCell}>{sgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{sgst.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{igstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{igst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={13} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      SUB TOTAL
                    </td>
                    
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      {invoiceData.laboursSubtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={13} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      GRAND TOTAL
                    </td>
                    
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      {((Number(invoiceData?.totalAmount) || 0) - (Number(invoiceData?.advanceAmount) || 0)).toFixed(2)}

                    </td>
                  </tr> <tr>
                    <td colSpan={13} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      ADVANCE AMOUNT
                    </td>
                    
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      {invoiceData.advanceAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={14} style={{ border: '2px solid #000', padding: '6px', textAlign: 'left' }}>
              <strong>Total Amount Of Invoice In Words:  {numberToWords((Number(invoiceData?.totalAmount) || 0) - (Number(invoiceData?.advanceAmount) || 0))} Only</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={14} style={{ border: '2px solid #000', padding: '6px', textAlign: 'left' }}>
              <strong>Customer Note:</strong>
              <textarea   style={{minWidth: '99%', fontSize:'1rem'}} ></textarea> 
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        position: 'relative',
                        textAlign: 'center',
                        borderRight: '1px solid #000',
                        height: '120px',
                        width: '33.33%',
                      }}
                    >
                      <img
                        src="/QR.png"
                        alt="QR Code"
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          width: '140px',
                          height: '140px',
                          marginBottom: '5px',
                        }}
                      />
                      <div>Scan QR Code</div>
                    </td>
                    <td
                      style={{
                        position: 'relative',
                        borderRight: '1px solid #000',
                        height: '120px',
                        width: '33.33%',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        Customer Signature Thumb
                      </div>
                    </td>

                    <td
                      style={{
                        position: 'relative',
                        height: '120px',
                        width: '33.33%',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        Auto Car Care Point
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        Authorized Signature
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td
              colSpan={2}
              style={{
                border: '1px solid #000',
                padding: '6px',
                textAlign: 'center',
              }}
            >
              Thank You For Visit.... This is a Computer Generated Invoice
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center',      
    padding: '10px 20px',     
}}>
  <button 
    style={{
      border: '1px solid #000',
      padding: '10px 20px',
      textAlign: 'center',
      color: 'red',
      cursor: 'pointer'
    }} 
    onClick={generatePDF}
  >
    Download PDF
  </button>
</div>
    </div>
  );
};
const tableBodyCell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

export default CounterBillPDF;
