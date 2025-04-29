import React, { FC } from 'react';
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

const CounterBillPDF: FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const state = location.state as LocationState;

  const invoiceItems = state.items || state.billRows || [];

  const grandTotal = invoiceItems
    .reduce((acc, row) => {
      const qty = row.qty ?? row.quantity ?? 0;
      const amt = row.amount ?? row.total ?? row.rate * qty;
      return acc + amt;
    }, 0)
    .toFixed(2);

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
              <p style={{ margin: 0 }}>Name: {state.customerName}</p>
              <p style={{ margin: 0 }}>Address: {state.customerAddress}</p>
              <p style={{ margin: 0 }}>Mobile: {state.customerMobile}</p>
              <p style={{ margin: 0 }}>Vehicle No: {state.vehicleNo}</p>
              {state.adharNo && <p style={{ margin: 0 }}>Aadhaar No: {state.adharNo}</p>}
              {state.gstin && <p style={{ margin: 0 }}>GSTIN: {state.gstin}</p>}
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
                Invoice No: {state.invoiceNumber}
              </p>
              <p style={{ margin: 0, textAlign: 'right' }}>
                Invoice Date: {state.invDate}
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
    </div>
  );
};

export default CounterBillPDF;

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
