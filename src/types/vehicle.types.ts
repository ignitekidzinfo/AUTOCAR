/**
 * Vehicle-related TypeScript type definitions
 */

export interface Vehicle {
    vehicleRegId: string;
    vehicleNumber?: string;
    customerName?: string;
    customerMobileNumber?: string;
    advancePayment?: number;
    kmsDriven?: number;
    superwiser?: string;
    technician?: string;
    worker?: string;
    status?: string;
    date?: string;
    hasInvoice?: boolean;
}

export interface VehicleRow {
    id: string;
    date: string;
    vehicleNoName: string;
    customerMobile: string;
    status: string;
    advance: number;
    superwiser: string;
    technician: string;
    worker: string;
    kilometer: string | number;
    vehicleRegId: string;
    hasInvoice: boolean;
    isNew?: boolean;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
}

export interface VehicleListFilters {
    vehicleRegId?: string;
    startDate?: string;
    endDate?: string;
    appointmentId?: string;
    status?: string;
}

export interface VehicleApiResponse {
    data: Vehicle | Vehicle[];
    content?: Vehicle[];
    totalPages?: number;
    totalElements?: number;
    currentPage?: number;
}

export type SearchType = 'Vehicle ID' | 'Date Range' | 'Appointment Number' | '';

export interface UseVehicleDataOptions {
    listType?: string | null;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseVehicleDataReturn {
    vehicles: VehicleRow[];
    loading: boolean;
    error: string | null;
    totalElements: number;
    refetch: () => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
    searchVehicles: (filters: VehicleListFilters, searchType: SearchType) => Promise<void>;
}

export interface VehicleRegDto {
    vehicleRegId: number;
    appointmentId?: number;
    vehicleNumber: string;
    vehicleBrand?: string;
    vehicleModelName?: string;
    vehicleVariant?: string;
    engineNumber?: string;
    chasisNumber?: string;
    numberPlateColour?: string;
    kmsDriven?: number;
    email?: string;
    ManufactureYear?: number;
    advancePayment?: number;
    customerId?: number;
    customerName: string;
    customerAddress?: string;
    customerMobileNumber: string;
    customerAadharNo?: string;
    customerGstin?: string;
    superwiser?: string;
    technician?: string;
    worker?: string;
    status?: string;
    userId?: number;
    date?: string;
    vehicleInspection?: string;
    jobCard?: string;
    insuranceStatus?: string;
    insuredFrom?: string;
    insuredTo?: string;
}
