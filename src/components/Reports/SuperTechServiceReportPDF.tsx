// SuperTechServiceReportPDF.tsx
import React, { FC, useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import apiClient from 'Services/apiService';

interface LocationState {
  invoiceNumber: string;
  jobCardNumber: string;
  transactionDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerAadharNo: string;
  customerGstin: string;
  regNo: string;
  model: string;
  kmsDriven: string;
  labours: {
    description: string;
    quantity: string;
    unitPrice: string;
    discountPercent: string;
    cgstPercent: string;
    sgstPercent: string;
    igstPercent: string;
  }[];
  laboursSubtotal: number;
}

const SuperTechServiceReportPDF: FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // fetch invoice by number
  useEffect(() => {
    (async () => {
      const invoiceNumber = searchParams.get('invoiceNumber');
      if (!invoiceNumber) return setLoading(false);
      try {
        const { data: inv } = await apiClient.get(
          `/api/vehicle-invoices/number/${invoiceNumber}`
        );
        setInvoiceData({
          invoiceNumber: inv.invoiceNumber,
          jobCardNumber: inv.jobCardNumber || '',
          transactionDate: inv.invoiceDate || '',
          customerName: inv.customerName || '',
          customerAddress: inv.customerAddress || '',
          customerMobile: inv.customerMobile || '',
          customerAadharNo: inv.customerAadharNo || '',
          customerGstin: inv.customerGstin || '',
          regNo: inv.regNo || '',
          model: inv.model || '',
          kmsDriven: inv.kmsDriven || '',
          labours: inv.labours || [],
          laboursSubtotal: inv.laboursSubtotal || 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // auto‐print when ready
  useEffect(() => {
    if (!loading && invoiceData) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, invoiceData]);

  if (loading) return <div>Loading...</div>;
  if (!invoiceData) return <div>No data found</div>;

  // convert number to words
  const numberToWords = (num: number): string => {
    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];
    if (num === 0) return 'Zero';
    const conv = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
        );
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          ' Hundred' +
          (n % 100 ? ' ' + conv(n % 100) : '')
        );
      if (n < 100000)
        return (
          conv(Math.floor(n / 1000)) +
          ' Thousand' +
          (n % 1000 ? ' ' + conv(n % 1000) : '')
        );
      if (n < 10000000)
        return (
          conv(Math.floor(n / 100000)) +
          ' Lakh' +
          (n % 100000 ? ' ' + conv(n % 100000) : '')
        );
      return (
        conv(Math.floor(n / 10000000)) +
        ' Crore' +
        (n % 10000000 ? ' ' + conv(n % 10000000) : '')
      );
    };
    return conv(num);
  };

  return (
    <>
      {/* PRINT‐ONLY STYLES */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }

          /* hide all page elements */
          body * { visibility: hidden; }

          /* but show our invoice and its children */
          #invoice-root, #invoice-root * { visibility: visible; }

          /* position and size the invoice within margins */
          #invoice-root {
            position: absolute;
            top: 10mm;
            left: 10mm;
            right: 10mm;
            width: auto !important;
          }
        }
      `}</style>

      <div
        id="invoice-root"
        ref={invoiceRef}
        style={{
          width: '100%',
          fontFamily: 'Arial, sans-serif',
          fontSize: '0.85rem',
          background: theme.palette.mode === 'dark' ? '#222' : '#fff',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000',
          }}
        >
          <tbody>
            {/* HEADER */}
            <tr>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  width: '70%',
                }}
              >
                <h2 style={{ margin: 0, textAlign: 'center' }}>
                  AUTO CAR CARE
                </h2>
                <p style={{ textAlign: 'center', margin: '4px 0' }}>
                  Buvasaheb Nagar, Shingnapur Road, Kolki,
                  Tal.Phaltan(415523), Dist.Satara.
                </p>
                <p style={{ textAlign: 'center', margin: '2px 0' }}>
                  Ph : 9595054555 / 7758817766 Email :
                  autocarcarepoint@gmail.com
                </p>
                <p style={{ textAlign: 'center', margin: '2px 0' }}>
                  GSTIN : 27GLYPS9891C1ZV
                </p>
              </td>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  verticalAlign: 'middle',
                }}
              >
                <strong style={{ fontSize: '1.2rem' }}>
                  TAX INVOICE
                </strong>
              </td>
            </tr>

            {/* CUSTOMER & VEHICLE */}
            <tr>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  fontWeight: 'bold',
                }}
              >
                CUSTOMER DETAILS
              </td>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  fontWeight: 'bold',
                  textAlign: 'right',
                }}
              >
                VEHICLE DETAILS
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  verticalAlign: 'top',
                }}
              >
                <p style={{ margin: 0 }}>
                  Name: {invoiceData.customerName}
                </p>
                <p style={{ margin: 0 }}>
                  Address: {invoiceData.customerAddress}
                </p>
                <p style={{ margin: 0 }}>
                  Mobile: {invoiceData.customerMobile}
                </p>
                <p style={{ margin: 0 }}>
                  Aadhar No: {invoiceData.customerAadharNo}
                </p>
                <p style={{ margin: 0 }}>
                  GSTIN: {invoiceData.customerGstin}
                </p>
              </td>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  verticalAlign: 'top',
                  textAlign: 'right',
                }}
              >
                <p style={{ margin: 0 }}>
                  Invoice No: {invoiceData.invoiceNumber}
                </p>
                <p style={{ margin: 0 }}>
                  Jobcard No: {invoiceData.jobCardNumber}
                </p>
                <p style={{ margin: 0 }}>
                  Date: {invoiceData.transactionDate}
                </p>
                <p style={{ margin: 0 }}>
                  Reg. No: {invoiceData.regNo}
                </p>
                <p style={{ margin: 0 }}>
                  Model: {invoiceData.model}
                </p>
                <p style={{ margin: 0 }}>
                  KMs Driven: {invoiceData.kmsDriven}
                </p>
              </td>
            </tr>

            {/* LABOUR WORK */}
            <tr>
              <td
                colSpan={2}
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  textAlign: 'center',
                }}
              >
                <strong>LABOUR WORK</strong>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        'S.No',
                        'Service',
                        'Qty',
                        'Unit Price',
                        '%',
                        'Disc Amt',
                        'Taxable Amt',
                        'CGST %',
                        'CGST Amt',
                        'SGST %',
                        'SGST Amt',
                        'IGST %',
                        'IGST Amt',
                        'Amount',
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            border: '1px solid grey',
                            padding: 6,
                            fontWeight: 'bold',
                            background:
                              theme.palette.mode === 'dark'
                                ? '#333'
                                : '#f5f5f5',
                            color:
                              theme.palette.mode === 'dark'
                                ? '#fff'
                                : '#000',
                            textAlign: 'center',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.labours.map((srv, idx) => {
                      const q = +srv.quantity || 0;
                      const p = +srv.unitPrice || 0;
                      const dp = +srv.discountPercent || 0;
                      const base = q * p;
                      const da = (base * dp) / 100;
                      const tax = base - da;
                      const cg = (tax * +srv.cgstPercent) / 100;
                      const sg = (tax * +srv.sgstPercent) / 100;
                      const ig = (tax * +srv.igstPercent) / 100;
                      const amt = tax + cg + sg + ig;
                      return (
                        <tr key={idx}>
                          {[
                            idx + 1,
                            srv.description,
                            q,
                            p.toFixed(2),
                            dp.toFixed(2),
                            da.toFixed(2),
                            tax.toFixed(2),
                            srv.cgstPercent,
                            cg.toFixed(2),
                            srv.sgstPercent,
                            sg.toFixed(2),
                            srv.igstPercent,
                            ig.toFixed(2),
                            amt.toFixed(2),
                          ].map((c, ci) => (
                            <td
                              key={ci}
                              style={{
                                border: '1px solid grey',
                                padding: 6,
                                textAlign: 'center',
                              }}
                            >
                              {c}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={13}
                        style={{
                          border: '1px solid grey',
                          padding: 6,
                          textAlign: 'right',
                          fontWeight: 'bold',
                        }}
                      >
                        TOTAL AMOUNT
                      </td>
                      <td
                        style={{
                          border: '1px solid grey',
                          padding: 6,
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        {invoiceData.laboursSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>

            {/* IN WORDS */}
            <tr>
              <td
                colSpan={2}
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  textAlign: 'left',
                }}
              >
                <strong>
                  Total Amount in Words:{' '}
                  {numberToWords(invoiceData.laboursSubtotal)} only
                </strong>
              </td>
            </tr>

            {/* SIGNATURE */}
            <tr>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  height: 80,
                  textAlign: 'center',
                  verticalAlign: 'bottom',
                }}
              >
                <div style={{ paddingBottom: 4 }}>
                  Customer Signature / Thumb
                </div>
              </td>
              <td
                style={{
                  border: '1px solid #000',
                  padding: 6,
                  height: 80,
                  textAlign: 'center',
                  verticalAlign: 'bottom',
                }}
              >
                <div style={{ paddingBottom: 4 }}>
                  Authorized Signature
                </div>
              </td>
            </tr>

            {/* FOOTER */}
            <tr>
              <td
                colSpan={2}
                style={{
                  border: '1px solid #000',
                  padding: 4,
                  textAlign: 'center',
                }}
              >
                Thank You For Visit… This is a Computer Generated Invoice
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SuperTechServiceReportPDF;
