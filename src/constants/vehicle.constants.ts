/**
 * Vehicle-related constants
 */

// Pagination
export const VEHICLE_PAGE_SIZE = 25;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

// Timing
export const DEBOUNCE_DELAY = 300; // ms
export const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds
export const HIGHLIGHT_DURATION = 10000; // 10 seconds for new/modified items
export const ERROR_DISPLAY_DURATION = 5000; // 5 seconds
export const DELETE_SUCCESS_DURATION = 3000; // 3 seconds

// Scroll
export const SCROLL_THRESHOLD = 200; // px

// API Endpoints
export const VEHICLE_ENDPOINTS = {
    GET_ALL: '/vehicle-reg/getAll',
    GET_STATUS: (status: string) => `/vehicle-reg/GetStatus?status=${status}`,
    GET_BY_ID: (id: string) => `/vehicle-reg/${id}`,
    DELETE: (id: string) => `/vehicle-reg/${id}`,
    INVOICE_CHECK: (vehicleRegId: string) => `/api/vehicle-invoices/search/vehicle-reg/${vehicleRegId}`,
} as const;

// Status filters for list types
export const LIST_TYPE_STATUS_MAP = {
    serviceQueue: 'waiting,inprogress',
    serviceHistory: 'complete',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    NEEDS_REFRESH: 'needsRefreshOnReturn',
    RECENT_CHANGES: 'recentVehicleChanges',
} as const;

// Status colors and icons
export const STATUS_CONFIG = {
    complete: {
        bgcolor: '#e8f5e9',
        textColor: '#2e7d32',
    },
    progress: {
        bgcolor: '#fff8e1',
        textColor: '#f57c00',
    },
    waiting: {
        bgcolor: '#e3f2fd',
        textColor: '#0288d1',
    },
    default: {
        bgcolor: '#e3f2fd',
        textColor: '#1976d2',
    },
} as const;

// Search types
export const SEARCH_TYPES = {
    VEHICLE_ID: 'Vehicle ID',
    DATE_RANGE: 'Date Range',
    APPOINTMENT_NUMBER: 'Appointment Number',
} as const;
