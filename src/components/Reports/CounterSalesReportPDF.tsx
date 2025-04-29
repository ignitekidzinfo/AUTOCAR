import React, { FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

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
  totalQuantity?: number;
  taxable?: number;
  items?: BillRow[];
  billRows?: BillRow[];
}

interface LocationState {
  invoiceNumber: string; 
  invDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  adharNo: string;
  gstin: string;
  vehicleNo: string;
  items?: BillRow[];
  billRows?: BillRow[];
}

interface ReportData {
  fromDate: string;
  toDate: string;
  reportData: Invoice[];
}

const CounterSaleRepostPDF: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isSummaryView, setIsSummaryView] = useState(false);
  const [singleInvoice, setSingleInvoice] = useState<Invoice | null>(null);

  // For single invoice view
  const state = location.state as LocationState || {
    invoiceNumber: '',
    invDate: '',
    customerName: '',
    customerAddress: '',
    customerMobile: '',
    adharNo: '',
    gstin: '',
    vehicleNo: '',
    items: [],
    billRows: []
  };

  useEffect(() => {
    // Parse the query parameter if it exists
    const query = new URLSearchParams(location.search).get('data');
    if (query) {
      try {
        const data = JSON.parse(decodeURIComponent(query)) as ReportData;
        setReportData(data);
        
        // If there's only one invoice in the reportData, it's a single invoice view
        if (data.reportData.length === 1) {
          setSingleInvoice(data.reportData[0]);
          setIsSummaryView(false);
        } else {
          setIsSummaryView(true);
        }
      } catch (error) {
        console.error('Error parsing report data:', error);
      }
    }
  }, [location.search]);

  // Add useEffect to trigger print dialog when component renders
  useEffect(() => {
    if ((isSummaryView && reportData) || singleInvoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSummaryView, reportData, singleInvoice]);

  // Get invoice items - either from location.state or from the query parameter
  const invoiceItems = singleInvoice 
    ? (singleInvoice.items || singleInvoice.billRows || [])
    : (state.items || state.billRows || []);

  // Calculate grand total
  const grandTotal = invoiceItems
    .reduce((acc, row) => {
      const qty = row.qty ?? row.quantity ?? 0;
      const amt = row.amount ?? row.total ?? row.rate * qty;
      return acc + amt;
    }, 0)
    .toFixed(2);

  // For summary report view
  const renderSummaryReport = () => {
    if (!reportData) return null;

    const { fromDate, toDate, reportData: invoices } = reportData;

    // Calculate totals
    const totals = invoices.reduce(
      (acc, invoice) => {
        return {
          quantity: acc.quantity + (invoice.totalQuantity || 0),
          taxable: acc.taxable + (invoice.taxable || 0),
          total: acc.total + (invoice.totalAmount || 0)
        };
      },
      { quantity: 0, taxable: 0, total: 0 }
    );

    return (
      <div style={{ 
        width: '100%', 
        maxWidth: '100%', 
        padding: '10px',
        fontFamily: 'Arial, sans-serif', 
        pageBreakInside: 'avoid'
      }}>
        <h2 style={{ textAlign: 'center', margin: '10px 0', fontWeight: 'bold' }}>Counter Sale Report</h2>
        <p style={{ textAlign: 'center', margin: '5px 0', fontWeight: 'bold' }}>
          From {fromDate} To {toDate}
        </p>

        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          marginTop: '10px',
          tableLayout: 'fixed' 
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{...headerCellStyle, width: '5%'}}>Sr.No</th>
              <th style={{...headerCellStyle, width: '10%'}}>Invoice No</th>
              <th style={{...headerCellStyle, width: '15%'}}>Invoice Date</th>
              <th style={{...headerCellStyle, width: '15%'}}>Total Quantity</th>
              <th style={{...headerCellStyle, width: '25%'}}>Taxable</th>
              <th style={{...headerCellStyle, width: '30%'}}>Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={invoice.id}>
                <td style={cellStyle}>{index + 1}</td>
                <td style={cellStyle}>{invoice.invoiceNumber}</td>
                <td style={cellStyle}>{invoice.invDate}</td>
                <td style={cellStyle}>{invoice.totalQuantity || 0}</td>
                <td style={cellStyle}>{Number(invoice.taxable || 0).toFixed(2)}</td>
                <td style={cellStyle}>{Number(invoice.totalAmount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <td colSpan={3} style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>Total</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.quantity}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.taxable.toFixed(2)}</td>
              <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <style>{`
          @media print {
            /* Hide all navigation and menu elements */
            .MuiDrawer-root, 
            .MuiAppBar-root,
            .sidebar,
            #sidebar,
            nav,
            aside,
            .navigation,
            .menu,
            .dashboard-text,
            .MuiListItem-root,
            .MuiList-root,
            [role="navigation"],
            [role="menu"],
            .header-nav,
            .nav-menu,
            .nav-links,
            .menu-items,
            .side-nav,
            .dashboard-menu,
            .dashboard-sidebar,
            .main-sidebar,
            .main-menu,
            .app-sidebar,
            .app-menu,
            .sidebar-wrapper,
            .sidebar-menu {
              display: none !important;
            }

            /* Hide specific text elements that might contain "Dashboard" */
            *[class*="dashboard"],
            *[id*="dashboard"],
            *[class*="menu"],
            *[id*="menu"],
            *[class*="sidebar"],
            *[id*="sidebar"] {
              display: none !important;
            }

            /* Ensure main content takes full width */
            body,
            #root,
            .app-content,
            .main-content,
            .content-wrapper,
            main,
            .MuiContainer-root,
            .MuiBox-root {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              position: absolute !important;
              left: 0 !important;
            }

            /* Basic print settings */
            @page {
              size: A4;
              margin: 0.5cm;
            }

            /* Ensure white background and black text */
            * {
              background-color: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Table specific styles */
            table {
              width: 100% !important;
              font-size: 10pt !important;
              page-break-inside: avoid !important;
            }

            th, td {
              padding: 4px !important;
            }

            /* Hide print button */
            button {
              display: none !important;
            }

            /* Optimize QR code size */
            img[alt="QR Code"] {
              width: 100px !important;
              height: 100px !important;
            }

            /* Hide Copyright component */
            footer, 
            .copyright,
            .MuiBox-root > .MuiTypography-root:last-child {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  };

  // Render the appropriate view
  if (isSummaryView) {
    return renderSummaryReport();
  }

  // Get customer and invoice details from either singleInvoice or state
  const invoiceData = singleInvoice || state;
  const customerName = singleInvoice ? singleInvoice.customerName : state.customerName;
  const customerAddress = singleInvoice ? singleInvoice.customerAddress : state.customerAddress;
  const customerMobile = singleInvoice ? singleInvoice.customerMobile : state.customerMobile;
  const vehicleNo = singleInvoice ? singleInvoice.vehicleNo : state.vehicleNo;
  const invoiceNumber = singleInvoice ? singleInvoice.invoiceNumber : state.invoiceNumber;
  const invDate = singleInvoice ? singleInvoice.invDate : state.invDate;
  const adharNo = singleInvoice ? singleInvoice.adharNo : state.adharNo;
  const gstin = singleInvoice ? singleInvoice.gstin : state.gstin;

  // Single invoice view
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        margin: '0 auto',
        padding: '1rem',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
      }}
    >
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
  }}
>
           <h2 style={{ margin: 0, fontWeight: 'bold' }}>AUTO CAR CARE POINT</h2>
           <p style={{ margin: 0 }}>
           Buvasaheb Nagar, Shingnapur Road, Kolki, Tal.Phaltan(415523), Dist.Satara.
           </p>
           <p style={{ margin: 0 }}>
           Ph : 9595054555 / 7758817766   Email : autocarcarepoint@gmail.com
           </p>
           <p style={{ margin: 0 }}>GSTIN : 27GLYPS9891C1ZV</p>
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
              INVOICE DETAILS
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
              <p style={{ margin: 0 }}>Name: {customerName}</p>
              <p style={{ margin: 0 }}>Address: {customerAddress}</p>
              <p style={{ margin: 0 }}>Mobile: {customerMobile}</p>
              <p style={{ margin: 0 }}>Vehicle No: {vehicleNo}</p>
              {adharNo && <p style={{ margin: 0 }}>Aadhaar No: {adharNo}</p>}
              {gstin && <p style={{ margin: 0 }}>GSTIN: {gstin}</p>}
            </td>
            <td
              style={{
                border: '1px solid #000',
                padding: '6px',
                verticalAlign: 'top',
                width: '50%',
              }}
            >
              <p style={{ margin: 0, textAlign: 'right' }}>
                Invoice No: {invoiceNumber}
              </p>
              <p style={{ margin: 0, textAlign: 'right' }}>
                Invoice Date: {invDate}
              </p>
            </td>
          </tr>

          <tr>
            <td
              colSpan={2}
              style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}
            >
              <strong>SPARES / ITEMS</strong>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                    }}
                  >
                    <th rowSpan={2} style={tableHeaderCell}>
                      S.No
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Particular/Item
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Qty
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Unit Price
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Discount (%)
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Taxable Amt
                    </th>
                    <th colSpan={2} style={tableHeaderCell}>
                      CGST
                    </th>
                    <th colSpan={2} style={tableHeaderCell}>
                      SGST
                    </th>
                    <th rowSpan={2} style={tableHeaderCell}>
                      Amount
                    </th>
                  </tr>
                  <tr
                    style={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                    }}
                  >
                    <th style={tableHeaderCell}>Rate</th>
                    <th style={tableHeaderCell}>Amt</th>
                    <th style={tableHeaderCell}>Rate</th>
                    <th style={tableHeaderCell}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item: BillRow, idx: number) => {
                    const quantity = item.qty ?? item.quantity ?? 0;
      return (
                      <tr key={idx}>
                        <td style={tableBodyCell}>{idx + 1}</td>
                        <td style={tableBodyCell}>{item.spareName}</td>
                        <td style={tableBodyCell}>{quantity}</td>
                        <td style={tableBodyCell}>{(item.rate || 0).toFixed(2)}</td>
                        <td style={tableBodyCell}>
                          {(item.discountPercent || 0).toFixed(2)}%
                        </td>
                        <td style={tableBodyCell}>
                          {(item.taxable || 0).toFixed(2)}
                        </td>
                        <td style={tableBodyCell}>
                          {(item.cgstPercent || 0).toFixed(2)}%
                        </td>
                        <td style={tableBodyCell}>
                          {(item.cgstAmt || 0).toFixed(2)}
          </td>
                        <td style={tableBodyCell}>
                          {(item.sgstPercent || 0).toFixed(2)}%
          </td>
                        <td style={tableBodyCell}>
                          {(item.sgstAmt || 0).toFixed(2)}
          </td>
                        <td style={tableBodyCell}>
                          {(item.amount || 0).toFixed(2)}
          </td>
        </tr>
      );
                  })}
</tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        ...tableBodyCell,
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      GRAND TOTAL
                    </td>
                    <td
                      style={{
                        ...tableBodyCell,
                        textAlign: 'right',
                        fontWeight: 'bold',
                      }}
                    >
                      {grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
      
      <style>{`
        @media print {
          /* Hide all navigation and menu elements */
          .MuiDrawer-root, 
          .MuiAppBar-root,
          .sidebar,
          #sidebar,
          nav,
          aside,
          .navigation,
          .menu,
          .dashboard-text,
          .MuiListItem-root,
          .MuiList-root,
          [role="navigation"],
          [role="menu"],
          .header-nav,
          .nav-menu,
          .nav-links,
          .menu-items,
          .side-nav,
          .dashboard-menu,
          .dashboard-sidebar,
          .main-sidebar,
          .main-menu,
          .app-sidebar,
          .app-menu,
          .sidebar-wrapper,
          .sidebar-menu {
            display: none !important;
          }

          /* Hide specific text elements that might contain "Dashboard" */
          *[class*="dashboard"],
          *[id*="dashboard"],
          *[class*="menu"],
          *[id*="menu"],
          *[class*="sidebar"],
          *[id*="sidebar"] {
            display: none !important;
          }

          /* Ensure main content takes full width */
          body,
          #root,
          .app-content,
          .main-content,
          .content-wrapper,
          main,
          .MuiContainer-root,
          .MuiBox-root {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            position: absolute !important;
            left: 0 !important;
          }

          /* Basic print settings */
          @page {
            size: A4;
            margin: 0.5cm;
          }

          /* Ensure white background and black text */
          * {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Table specific styles */
          table {
            width: 100% !important;
            font-size: 10pt !important;
            page-break-inside: avoid !important;
          }

          th, td {
            padding: 4px !important;
          }

          /* Hide print button */
          button {
            display: none !important;
          }

          /* Optimize QR code size */
          img[alt="QR Code"] {
            width: 100px !important;
            height: 100px !important;
          }

          /* Hide Copyright component */
          footer, 
          .copyright,
          .MuiBox-root > .MuiTypography-root:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Styles for the summary report
const headerCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '8px',
  textAlign: 'center',
  fontWeight: 'bold',
  backgroundColor: '#f2f2f2',
};

const cellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '8px',
  textAlign: 'center',
};

export default CounterSaleRepostPDF;

const tableHeaderCell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

const tableBodyCell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '6px',
  textAlign: 'center',
  verticalAlign: 'middle',
};
