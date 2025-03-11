interface InvoiceFormData {
    // Left side (Customer Details)
    customerName: string;
    customerAddress: string;
    customerMobile: string;
    customerAadharNo: string;
    customerGstin: string;
  
    // Right side (Invoice/Vehicle Details)
    invoiceNo: string;
    date: string;
    jobcardNo: string;
    regNo: string;
    model: string;
    kmsDriven: string;
  
    // SPARES table
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
  
    // LABOUR WORK table
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
  
    // Totals
    subTotal: number;
    totalAmount: number;
    advanceAmount: number;
    totalInWords: string;
  }
  