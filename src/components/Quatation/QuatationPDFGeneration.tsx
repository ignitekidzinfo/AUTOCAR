import React, { FC, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
// import { InvoiceFormData } from './InvoiceFormData';
import  { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const CounterBillPDF: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const state = location.state as LocationState;

  const invoiceRef = useRef<HTMLDivElement>(null); 

  const { id } = useParams(); // Get the quotation ID from the URL
//   const [quotation, setQuotation] = useState(null);
const [quotation, setQuotation] = useState<Quotation | null>(null); // Initialize with null

  const [globalDiscount, setGlobalDiscount] = useState(0); // Example global discount state

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await apiClient.get(`/api/quotations/${id}`);
        const data = response.data;
        setQuotation(data);
      } catch (error) {
        console.error('Error fetching quotation:', error);
      }
    };

    fetchQuotation();
    computeTotals();
  }, [id]);
  
//   const computeTotals = () => {
//     const computeItemTotal = (item: {
//         quantity: string;
//         unitPrice: string;
//         discountPercent: string;
//     }) => {
//         const quantity = Number(item.quantity) || 0;
//         const unitPrice = Number(item.unitPrice) || 0;
//         const discountPercent = Number(item.discountPercent) || 0;

//         const baseAmount = quantity * unitPrice;
//         const discount = (baseAmount * discountPercent) / 100;
//         const taxableAmount = baseAmount - discount;

//         return { total: taxableAmount, discount, baseAmount }; // Return discount and baseAmount if needed
//     };

//     // Assuming partLines and labourLines are arrays of items
//     const partsTotals = partLines.map(computeItemTotal); // Adjusted to directly use partLines
//     const laboursTotals = labourLines.map(computeItemTotal); // Adjusted to directly use labourLines

//     const partsSubtotal = partsTotals.reduce((acc, item) => acc + item.total, 0);
//     const laboursSubtotal = laboursTotals.reduce((acc, item) => acc + item.total, 0);
//     const subTotal = partsSubtotal + laboursSubtotal;
//     const totalAmount = subTotal; // You can add taxes or other calculations here if needed

//     return { partsTotals, laboursTotals, partsSubtotal, laboursSubtotal, subTotal, totalAmount };
// };


// Assuming you have these in your component's state or props
const partLines: PartLine[] = quotation?.partLines || []; // Replace with your actual data source
const labourLines: LabourLine[] = quotation?.labourLines || []; // Replace with your actual data source

const computeTotals = () => {
    const computeItemTotal = (item: PartLine | LabourLine) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPercent = Number(item.discountPercent) || 0;

        const baseAmount = quantity * unitPrice;
        const discount = (baseAmount * discountPercent) / 100;
        const taxableAmount = baseAmount - discount;

        return { total: taxableAmount, discount, baseAmount }; // Return discount and baseAmount if needed
    };

    // Use the defined partLines and labourLines
    const partsTotals = partLines.map(computeItemTotal);
    const laboursTotals = labourLines.map(computeItemTotal);

    // Provide explicit types for the reduce function parameters
    const partsSubtotal = partsTotals.reduce((acc: number, item) => acc + item.total, 0);
    const laboursSubtotal = laboursTotals.reduce((acc: number, item) => acc + item.total, 0);
    const subTotal = partsSubtotal + laboursSubtotal;
    const totalAmount = subTotal; // You can add taxes or other calculations here if needed

    return { partsTotals, laboursTotals, partsSubtotal, laboursSubtotal, subTotal, totalAmount };
};

const totals = computeTotals();
  if (!quotation) {
    return <div>Loading...</div>; // Loading state
  }

  const generatePDF = async () => {
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) {
      console.error("Invoice element not found!");
      return;
    }

    const options = { scale: 2 };
        const canvas = await html2canvas(invoiceElement, options as any);
    const imgData = canvas.toDataURL("image/png",0.7);

    const pageWidth = 210; 
    const pageHeight = 297; 

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width; 

    let finalHeight = imgHeight;
    let scaleFactor = 1;

    if (finalHeight > pageHeight) {
      scaleFactor = pageHeight / imgHeight; 
      finalHeight = pageHeight;
    }

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true,  // Enable compression
    });    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
    pdf.save("invoice.pdf");
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
  return (
    <div
      ref={invoiceRef}
       id="invoice-container"
      style={{
        width: '100%',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '5mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.6rem',
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
            <td
             colSpan={2} style={{ padding: '0' }}
            >
               <div style={{ display: 'flex', width: '100%' }}>
               <div style={{ width: '50%', border: '1px solid #000', padding: '6px', }}>
              <p style={{ margin: 0 }}>Name: {quotation.customerName || "NA"}</p>
              <p style={{ margin: 0 }}>Address: {quotation.customerAddress || "NA"}</p>
              <p style={{ margin: 0 }}>Mobile: {quotation.customerMobile || "NA"}</p>
              
              <p style={{ margin: 0 }}>Email: {quotation.customerEmail || "NA"}</p>
              </div>
              <div style={{ width: '50%', border: '1px solid #000', padding: '6px',}}>
<div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)', // Two equal columns
      gap: '4px', // Space between columns
    }}
  >
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
            Amout 
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
        
      
       
        </tr>
                </thead>
                <tbody>
                  {quotation.partLines.map((part, index) => {
                    const quantity = Number(part.quantity) || 0;
                    const unitPrice = Number(part.unitPrice) || 0;
                 
                        const discountPercent = part.discountPercent || 0;
                        const discount = (quantity * unitPrice * discountPercent) / 100;
                        const amount = (quantity * unitPrice) - discount;
                    return (
                      <tr key={index}>
                        <td style={tableBodyCell}>{index + 1}</td>
                        <td style={tableBodyCell}>{part.partName}</td>
                        <td style={tableBodyCell}>{quantity}</td>
                        <td style={tableBodyCell}>{unitPrice.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discountPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>
                        {/* <td style={tableBodyCell}>{cgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgst.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{sgst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{sgstPercent.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{igst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{igstPercent.toFixed(2)}</td> */}
                        {/* <td style={tableBodyCell}>{amount.toFixed(2)}</td> */}

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      SUB TOTAL
                    </td>
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                    {totals.partsSubtotal?.toFixed(2) || "0.00"}
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
       
     
       
      
        </tr>
          
          
                </thead>
                <tbody>
                  {quotation.labourLines.map((part, index) => {        
                    // const quantity = Number(part.quantity) || 0;
                    // const unitPrice = Number(part.unitPrice) || 0;
                    // const globalDiscountPercent = state.globalDiscount || 0;
                    // const discountPercent = globalDiscountPercent > 0 ? globalDiscountPercent : Number(part.discountPercent) || 0;
                    // const base = quantity * unitPrice;
                    // const discount = base * discountPercent / 100;
                    // const taxableAmount = base - discount;

                    // const cgstPercent=Number(part.cgstPercent)
                    // const sgstPercent=Number(part.sgstPercent)
                    // const igstPercent=Number(part.igstPercent)

                    // const cgst = (taxableAmount *Number(part.cgstPercent)) / 100;
                    // const sgst = (taxableAmount *Number(part.sgstPercent)) / 100;
                    // const igst = (taxableAmount *Number(part.igstPercent)) / 100;
                    // console.log(sgst,cgst,igst)
                    // const amount = taxableAmount;
                    const quantity = Number(part.quantity) || 0;
                    const unitPrice = Number(part.unitPrice) || 0;
                 
                        const discountPercent = part.discountPercent || 0;
                        const discount = (quantity * unitPrice * discountPercent) / 100;
                        const amount = (quantity * unitPrice) - discount;
                    return (
                      <tr key={index}>
                        <td style={tableBodyCell}>{index + 1}</td>
                        <td style={tableBodyCell}>{part.name}</td>
                        <td style={tableBodyCell}>{quantity}</td>
                        <td style={tableBodyCell}>{unitPrice.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discountPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{discount.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td>
                        {/* <td style={tableBodyCell}>{cgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{cgst.toFixed(2)}</td>   
                        <td style={tableBodyCell}>{sgstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{sgst.toFixed(2)}</td>  
                         <td style={tableBodyCell}>{igstPercent.toFixed(2)}</td>
                        <td style={tableBodyCell}>{igst.toFixed(2)}</td>
                        <td style={tableBodyCell}>{amount.toFixed(2)}</td> */}

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      SUB TOTAL
                    </td>
                    
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      {totals.laboursSubtotal.toFixed(2) || 0} 
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      GRAND TOTAL
                    </td>
                    
                    <td style={{ ...tableBodyCell, textAlign: 'right', fontWeight: 'bold' }}>
                      {/* {((Number(state?.totalAmount) || 0) - (Number(state?.advanceAmount) || 0)).toFixed(2)} */}
                      {totals.totalAmount.toFixed(2) || 0} 

                    </td>
                  </tr> 
                </tfoot>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={14} style={{ border: '2px solid #000', padding: '6px', textAlign: 'left' }}>
              <strong>Total Amount Of Invoice In Words:  {numberToWords((Number(totals?.totalAmount) || 0) )} Only</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={14} style={{ border: '2px solid #000', padding: '6px', textAlign: 'left' }}>
              <strong>Customer Note:</strong>
              <textarea   style={{minWidth: '99%', fontSize:'1rem',padding: '10px',margin:'2px'}} ></textarea> 
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
                          marginBottom: '10px',
                          padding:'5px',
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