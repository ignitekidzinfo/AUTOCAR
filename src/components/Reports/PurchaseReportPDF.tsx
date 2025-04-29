import React, { FC, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

interface GroupedTransaction {
  id: number;
  invoiceNumber: string;
  invDate: string;
  totalQuantity: number;
  taxable: number;
  netTotal: number;
  transactions: SparePartTransaction[];
}

interface LocationState {
  fromDate: string;
  toDate: string;
  reportData: GroupedTransaction[];
  transactions: SparePartTransaction[];
}

const PurchaseReportPDF: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const parseQueryData = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const dataParam = searchParams.get('data');
      if (dataParam) {
        const decodedData = decodeURIComponent(dataParam);
        return JSON.parse(decodedData) as LocationState;
      }
      return null;
    } catch (error) {
      console.error("Error parsing query data:", error);
      return null;
    }
  };

  const queryData = parseQueryData();
  const fromDate = queryData?.fromDate || '';
  const toDate = queryData?.toDate || '';
  const reportData = queryData?.reportData || [];
  const transactions = queryData?.transactions || [];
  const selectedBill = reportData && reportData.length === 1 ? reportData[0] : null;
  const billItems = selectedBill ? selectedBill.transactions : transactions;
  const billNo = selectedBill ? selectedBill.invoiceNumber : "All Bills";
  
  console.log("Purchase report data:", reportData);
  console.log("Transactions:", billItems);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) {
      console.error("Invoice element not found!");
      return;
    }

    try {
      console.log("Starting PDF generation process...");
      const options = { scale: 3 };
    const canvas = await html2canvas(invoiceElement, options as any);
    const imgData = canvas.toDataURL("image/png", 0.9);

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
      compress: true,
    });
      
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
      
      console.log("PDF created, opening in new tab...");
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Purchase Report</title>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  overflow: hidden;
                }
                embed {
                  width: 100%;
                  height: 100%;
                }
              </style>
            </head>
            <body>
              <embed width="100%" height="100%" src="${blobUrl}" type="application/pdf" />
            </body>
          </html>
        `);
        newTab.document.close();
      } else {
        alert("Please allow pop-ups to view PDF in a new tab");
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Purchase_Report_${new Date().toISOString().slice(0,10)}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF");
    }
  };
  const billsMap: Record<string, SparePartTransaction[]> = {};
  if (billItems && billItems.length > 0) {
    billItems.forEach(transaction => {
      const billNo = transaction.billNo || 'Unknown';
      if (!billsMap[billNo]) {
        billsMap[billNo] = [];
      }
      billsMap[billNo].push(transaction);
    });
  }

  const renderBills = () => {
    if (selectedBill) {
      return renderBillContent(selectedBill.invoiceNumber, selectedBill.transactions);
    } else if (Object.keys(billsMap).length > 0) {
      return Object.entries(billsMap).map(([billNo, items], index) => (
        <div key={billNo} style={{ marginBottom: '30px', pageBreakAfter: 'always' }}>
          {renderBillContent(billNo, items)}
          {index < Object.keys(billsMap).length - 1 && <div style={{ breakAfter: 'page' }}></div>}
        </div>
      ));
    } else {
      return <p>No data available</p>;
    }
  };
  const renderBillContent = (billNo: string, items: SparePartTransaction[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let totalCGST = 0;
    let totalSGST = 0;
    
    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      const cgstRate = item.cgst || 0;
      const sgstRate = item.sgst || 0;
      
      totalCGST += (itemSubtotal * cgstRate) / 100;
      totalSGST += (itemSubtotal * sgstRate) / 100;
    });
    
    const netTotal = subTotal + totalCGST + totalSGST;
    
    const transactionDate = new Date(items[0]?.transactionDate || new Date());
    const formattedDate = transactionDate.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    }) + " (" + transactionDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ")";
    
    return (
      <>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
          <h2 style={{ margin: '5px 0', fontSize: '18px' }}>Auto Car Care Point</h2>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>
            Buvasaheb Nagar, Shingnapur Road, Kolki, Phaltan, Tal.Phaltan(415523), Dist.Satara.
          </p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>Contact No : 9767102794</p>
          <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>PURCHASE BILL</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', borderBottom: '1px solid #000' }}>
          <div><strong>Bill NO :</strong>{billNo}</div>
          <div>
            <strong>Date :</strong>{formattedDate}
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Sr No.</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Item</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                <div>GST</div>
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '50%', borderRight: '1px solid #000', textAlign: 'center' }}>CGST%</div>
                  <div style={{ width: '50%', textAlign: 'center' }}>SGST%</div>
                </div>
              </th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Qty</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Rate</th>
              <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>
                  {item.partNumber} {item.partName}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '50%', textAlign: 'center', borderRight: '1px solid #000' }}>{item.cgst || 0}</div>
                    <div style={{ width: '50%', textAlign: 'center' }}>{item.sgst || 0}</div>
                  </div>
                </td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                  {item.price.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                  {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
            
            <tr>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>{totalQuantity}</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>-</td>
              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{subTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <table style={{ width: '40%', borderCollapse: 'collapse' }}>
            <tr>
              <td style={{ padding: '3px', textAlign: 'right' }}>Sub Total</td>
              <td style={{ padding: '3px', textAlign: 'right', width: '100px' }}>{subTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px', textAlign: 'right' }}>Total CGST</td>
              <td style={{ padding: '3px', textAlign: 'right' }}>{totalCGST.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px', textAlign: 'right' }}>Total SGST</td>
              <td style={{ padding: '3px', textAlign: 'right' }}>{totalSGST.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
              <td style={{ padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>{netTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </>
    );
  };
  
  return (
    <>
    <div
      ref={invoiceRef}
      id="invoice-container"
      style={{
          width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
          padding: '10mm',
        fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
      }}
    >
        {renderBills()}
      </div>
      
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
      onClick={generatePDF}
    >
    Print
    </button>
    </div>
          </>
  );
};

export default PurchaseReportPDF;