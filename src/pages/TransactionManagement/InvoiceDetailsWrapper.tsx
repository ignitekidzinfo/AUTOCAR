// import React, { useState } from "react";
// import { useParams } from "react-router-dom";
// import InvoiceDetails from "pages/TransactionManagement/InvoiceDetails";

// function InvoiceDetailsWrapper() {
//   const params = useParams<{ id: string }>();
//   const paramId = params.id;
//   // Attempt to parse the id from the URL
//   const parsedId = Number(paramId);

//   // Local state to store a valid invoice id
//   const [invoiceId, setInvoiceId] = useState<number | null>(
//     !isNaN(parsedId) && parsedId > 0 ? parsedId : null
//   );
//   // State for the manual input value
//   const [inputId, setInputId] = useState<string>("");

//   // If invoiceId is not set, show a form to enter one manually
//   if (invoiceId === null) {
//     return (
//       <div style={{ textAlign: "center", marginTop: "2rem" }}>
//         <h2>Please enter a valid Invoice ID</h2>
//         <input
//           type="text"
//           value={inputId}
//           onChange={(e) => setInputId(e.target.value)}
//           placeholder="Enter Invoice ID"
//           style={{ padding: "8px", fontSize: "1rem" }}
//         />
//         <button
//           onClick={() => {
//             const id = Number(inputId);
//             if (!isNaN(id) && id > 0) {
//               setInvoiceId(id);
//             } else {
//               alert("Please enter a valid numeric Invoice ID");
//             }
//           }}
//           style={{ marginLeft: "8px", padding: "8px 16px", fontSize: "1rem", cursor: "pointer" }}
//         >
//           Fetch Invoice
//         </button>
//       </div>
//     );
//   }

//   // Once a valid invoiceId exists, render the InvoiceDetails component
//   return <InvoiceDetails invoiceId={invoiceId} />;
// }

// export default InvoiceDetailsWrapper;
