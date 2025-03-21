// // src/types/InvoiceData.ts

// export interface InvoicePartLine {
//     id: number;
//     lineNo: number;
//     partName: string;
//     quantity: number;
//     unitPrice: number;
//     discountPercent: number;
//     discountAmt: number;
//     taxableAmt: number;
//     cgstPercent: number;
//     cgstAmt: number;
//     sgstPercent: number;
//     sgstAmt: number;
//     igstPercent: number;
//     igstAmt: number;
//     finalAmount: number;
//   }
  
//   export interface InvoiceLabourLine {
//     id: number;
//     lineNo: number;
//     description: string;
//     quantity: number;
//     unitPrice: number;
//     discountPercent: number;
//     discountAmt: number;
//     taxableAmt: number;
//     cgstPercent: number;
//     cgstAmt: number;
//     sgstPercent: number;
//     sgstAmt: number;
//     igstPercent: number;
//     igstAmt: number;
//     finalAmount: number;
//   }
  
//   export interface InvoiceData {
//     id: number;
//     invoiceNumber: string;
//     invoiceDate: string; // or Date if you parse it
//     jobcardNo: string;
//     customerName: string;
//     customerAddress: string;
//     customerMobile: string;
//     vehicleNumber: string;
//     engineNumber: string;
//     kmsDriven: number;
//     vehicleBrand: string;
//     vehicleModelName: string;
  
//     // Totals
//     sparesSubTotal: number;
//     labourSubTotal: number;
//     grandTotal: number;
//     advanceAmount: number;
//     netAmount: number;
//     amountInWords: string;
  
//     comments?: string; // optional
  
//     // Lines
//     partLines: InvoicePartLine[];
//     labourLines: InvoiceLabourLine[];
//   }
  