export interface SparePartData {
    id?: string;
    partName: string;
    manufacturer: string;
    partNumber: string;
    price: number;
    stockQuantity: number;
    photo?: string; // Assuming it's a base64 string or URL
  }

  export interface filter {
    vehicleRegId? : string;
    appointmentId? :string;
    startDate? : string;
    endDate? : string;
    status?: string;
  }
  