export interface  VehicleFormData {
    vehicleRegId?:string;
    appointmentId: string;
    chasisNumber: string;
    customerAddress: string;
    customerAadharNo: string;
    customerGstin: string;
    superwiser: string;
    technician: string;
    worker: string;
    status: "In Progress" | "Complete" | "Waiting";
    date: string;
  }