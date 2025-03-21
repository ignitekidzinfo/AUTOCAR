// import React, { useEffect, useState, CSSProperties } from "react";
// import axios from "axios";
// import { InvoiceData } from "./InvoiceData"; // your interface file

// // Define the props interface
// interface InvoiceDetailsProps {
//   invoiceId: number;
// }

// function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
//   // Explicitly type the state
//   const [invoice, setInvoice] = useState<InvoiceData | null>(null);
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     axios
//       .get<InvoiceData>(`http://localhost:8080/api/invoices/${invoiceId}`)
//       .then((response) => {
//         setInvoice(response.data);
//       })
//       .catch((err) => {
//         setError(err);
//       });
//   }, [invoiceId]);

//   if (error) {
//     return <div>Error loading invoice: {error.message}</div>;
//   }

//   if (!invoice) {
//     return <div>Loading invoice...</div>;
//   }

//   const thStyle: CSSProperties = {
//     border: "1px solid #000",
//     padding: "4px",
//     fontWeight: "bold",
//     fontSize: "0.85rem",
//     textAlign: "center",
//   };

//   const tdStyle: CSSProperties = {
//     border: "1px solid #ccc",
//     padding: "4px",
//     fontSize: "0.85rem",
//     textAlign: "center",
//   };

//   return (
//     <div style={{ width: "80%", margin: "auto" }}>
//       {/* Render your invoice data */}
//       <h4 style={{ marginTop: "1rem" }}>LABOUR WORK</h4>
//       <table style={{ width: "100%", borderCollapse: "collapse" }}>
//         <thead>
//           <tr style={{ borderBottom: "1px solid #000" }}>
//             <th style={thStyle}>S.No</th>
//             <th style={thStyle}>Particulars Of Services</th>
//             <th style={thStyle}>Qty</th>
//             <th style={thStyle}>Unit Price</th>
//             <th style={thStyle}>Discount %</th>
//             <th style={thStyle}>Discount Amt</th>
//             <th style={thStyle}>Taxable Amt</th>
//             <th style={thStyle}>CGST %</th>
//             <th style={thStyle}>CGST Amt</th>
//             <th style={thStyle}>SGST %</th>
//             <th style={thStyle}>SGST Amt</th>
//             <th style={thStyle}>IGST %</th>
//             <th style={thStyle}>IGST Amt</th>
//             <th style={thStyle}>Amount</th>
//           </tr>
//         </thead>
//         <tbody>
//   {(invoice.labourLines || []).map((labour) => (
//     <tr key={labour.id} style={{ borderBottom: "1px solid #ccc" }}>
//       <td style={tdStyle}>{labour.lineNo}</td>
//       <td style={tdStyle}>{labour.description}</td>
//       <td style={tdStyle}>{labour.quantity ?? 0}</td>
//       <td style={tdStyle}>{(labour.unitPrice ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{labour.discountPercent ?? 0}</td>
//       <td style={tdStyle}>{(labour.discountAmt ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{(labour.taxableAmt ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{labour.cgstPercent ?? 0}</td>
//       <td style={tdStyle}>{(labour.cgstAmt ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{labour.sgstPercent ?? 0}</td>
//       <td style={tdStyle}>{(labour.sgstAmt ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{labour.igstPercent ?? 0}</td>
//       <td style={tdStyle}>{(labour.igstAmt ?? 0).toFixed(2)}</td>
//       <td style={tdStyle}>{(labour.finalAmount ?? 0).toFixed(2)}</td>
//     </tr>
//   ))}
//   <tr>
//     <td colSpan={13} style={{ textAlign: "right", padding: "4px" }}>
//       <strong>SUB TOTAL</strong>
//     </td>
//     <td style={{ textAlign: "right", padding: "4px" }}>
//       <strong>{(invoice.labourSubTotal ?? 0).toFixed(2)}</strong>
//     </td>
//   </tr>
// </tbody>

//       </table>

//       <div style={{ marginTop: "1rem", textAlign: "right" }}>
//         <p>
//           <strong>TOTAL AMOUNT:</strong> {invoice.grandTotal.toFixed(2)}
//         </p>
//         <p>
//           <strong>ADVANCE AMOUNT:</strong> {invoice.advanceAmount.toFixed(2)}
//         </p>
//         <p>
//           <strong>BALANCE DUE:</strong> {invoice.netAmount.toFixed(2)}
//         </p>
//         <p>
//           <strong>Total Amount in Words:</strong> {invoice.amountInWords}
//         </p>
//       </div>

//       {invoice.comments && (
//         <div style={{ marginTop: "1rem" }}>
//           <strong>Comments:</strong>
//           <p>{invoice.comments}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default InvoiceDetails;
