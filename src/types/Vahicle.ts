export interface  VehicleFormData {
    appointmentId: string;
    chasisNumber: string;
    customerAddress: string;
    customerAadhar: string;
    customerGstin: string;
    supervisor: string;
    technician: string;
    worker: string;
    status: "In Progress" | "Complete" | "Waiting";
    date: string;
  }