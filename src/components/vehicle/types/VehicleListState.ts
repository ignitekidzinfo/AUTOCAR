/**
 * Type definitions for VehicleList component
 * Provides clean, type-safe state management
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

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    hasMore: boolean;
}

export interface VehicleListState {
    vehicles: VehicleRow[];
    loading: boolean;
    initialLoad: boolean;
    error: string | null;
    pagination: PaginationState;
}

export interface SearchState {
    localSearchTerm: string;
    selectedType: 'Vehicle ID' | 'Date Range' | 'Appointment Number' | '';
    textInput: string;
    dateRange: [Date | null, Date | null];
    isSearching: boolean;
    showAdvancedSearch: boolean;
}

export interface DeleteModalState {
    open: boolean;
    selectedId: string;
    isDeleting: boolean;
    error: string | null;
}

export type SearchType = 'Vehicle ID' | 'Date Range' | 'Appointment Number';

export interface SearchRequest {
    vehicleRegId?: string;
    appointmentId?: string;
    startDate?: string;
    endDate?: string;
}
