export interface InvoiceFormData {
    customerName: string;
    customerAddress: string;
    customerMobile: string;
    customerAadharNo: string;
    customerGstin: string;
  
    invoiceNo: string;
    date: string;
    jobcardNo: string;
    regNo: string;
    model: string;
    kmsDriven: string;
  
    spares: {
      srNo: number;
      particulars: string;
      qty: number;
      unitPrice: number;
      discount: number;
      taxableAmt: number;
      cgst: number;
      sgst: number;
      igst: number;
      amount: number;
    }[];
  
    labour: {
      srNo: number;
      particulars: string;
      qty: number;
      unitPrice: number;
      discount: number;
      taxableAmt: number;
      cgst: number;
      sgst: number;
      igst: number;
      amount: number;
    }[];
  
    subTotal: number;
    totalAmount: number;
    advanceAmount: number;
    totalInWords: string;
  }
  