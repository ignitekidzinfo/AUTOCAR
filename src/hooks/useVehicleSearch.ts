/**
 * Custom hook for vehicle search functionality
 * Handles local filtering and advanced search
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VehicleRow, SearchRequest, SearchType } from 'components/vehicle/types/VehicleListState';
import {
    GetVehicleByAppointmentID,
    GetVehicleByDateRange,
    VehicleDataByID,
} from 'Services/vehicleService';

const DEBOUNCE_DELAY = 300;

interface UseVehicleSearchReturn {
    // Search state
    searchState: {
        localSearchTerm: string;
        selectedType: SearchType | '';
        textInput: string;
        dateRange: [Date | null, Date | null];
        isSearching: boolean;
        showAdvancedSearch: boolean;
    };

    // Actions
    setLocalSearchTerm: (term: string) => void;
    setSelectedType: (type: SearchType | '') => void;
    setTextInput: (text: string) => void;
    setDateRange: (range: [Date | null, Date | null]) => void;
    setShowAdvancedSearch: (show: boolean) => void;
    performSearch: () => Promise<VehicleRow[]>;

    // Filtered results
    getFilteredVehicles: (vehicles: VehicleRow[]) => VehicleRow[];
}

export const useVehicleSearch = (): UseVehicleSearchReturn => {
    const [localSearchTerm, setLocalSearchTermState] = useState('');
    const [selectedType, setSelectedType] = useState<SearchType | ''>('');
    const [textInput, setTextInput] = useState('');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Set local search term with debouncing
     */
    const setLocalSearchTerm = useCallback((term: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setLocalSearchTermState(term.toLowerCase());
        }, DEBOUNCE_DELAY);
    }, []);

    /**
     * Filter vehicles based on local search term
     */
    const getFilteredVehicles = useCallback((vehicles: VehicleRow[]): VehicleRow[] => {
        if (!localSearchTerm) return vehicles;

        return vehicles.filter((row) =>
            row.vehicleNoName?.toLowerCase().includes(localSearchTerm) ||
            row.customerMobile?.toLowerCase().includes(localSearchTerm) ||
            row.status?.toLowerCase().includes(localSearchTerm) ||
            row.superwiser?.toLowerCase().includes(localSearchTerm) ||
            row.technician?.toLowerCase().includes(localSearchTerm) ||
            row.worker?.toLowerCase().includes(localSearchTerm) ||
            row.kilometer?.toString().includes(localSearchTerm) ||
            row.advance?.toString().includes(localSearchTerm)
        );
    }, [localSearchTerm]);

    /**
     * Perform advanced search (API-based)
     */
    const performSearch = useCallback(async (): Promise<VehicleRow[]> => {
        if (isSearching) return [];

        setIsSearching(true);

        try {
            let response: any;

            if (selectedType === 'Vehicle ID') {
                const res = await VehicleDataByID(textInput);
                response = res.data;
            } else if (selectedType === 'Date Range') {
                const requestData: SearchRequest = {
                    startDate: dateRange[0] ? dateRange[0].toISOString().slice(0, 10) : '',
                    endDate: dateRange[1] ? dateRange[1].toISOString().slice(0, 10) : '',
                };
                const res = await GetVehicleByDateRange(requestData);
                response = res.data;
            } else if (selectedType === 'Appointment Number') {
                const requestData: SearchRequest = { appointmentId: textInput };
                const res = await GetVehicleByAppointmentID(requestData);
                response = res.data;
            }

            // Transform response to VehicleRow array
            if (Array.isArray(response)) {
                return response.map((vehicle: any, index: number) => ({
                    id: vehicle.vehicleRegId || `search-${index}`,
                    date: vehicle.date ?? '',
                    vehicleNoName: vehicle.vehicleNumber ?? '',
                    customerMobile: vehicle.customerName
                        ? `${vehicle.customerName} - ${vehicle.customerMobileNumber ?? ''}`
                        : '',
                    status: vehicle.status ?? '',
                    advance: vehicle.advancePayment ?? 0,
                    superwiser: vehicle.superwiser ?? '',
                    technician: vehicle.technician ?? '',
                    worker: vehicle.worker ?? '',
                    kilometer: vehicle.kmsDriven ?? '',
                    vehicleRegId: vehicle.vehicleRegId,
                    hasInvoice: false,
                }));
            } else if (response && typeof response === 'object') {
                // Single vehicle result
                return [{
                    id: '1',
                    date: response.date ?? '',
                    vehicleNoName: response.vehicleNumber ?? '',
                    customerMobile: response.customerName
                        ? `${response.customerName} - ${response.customerMobileNumber ?? ''}`
                        : '',
                    status: response.status ?? '',
                    advance: response.advancePayment ?? 0,
                    superwiser: response.superwiser ?? '',
                    technician: response.technician ?? '',
                    worker: response.worker ?? '',
                    kilometer: response.kmsDriven ?? '',
                    vehicleRegId: response.vehicleRegId,
                    hasInvoice: false,
                }];
            }

            return [];
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        } finally {
            setIsSearching(false);
        }
    }, [isSearching, selectedType, textInput, dateRange]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        searchState: {
            localSearchTerm,
            selectedType,
            textInput,
            dateRange,
            isSearching,
            showAdvancedSearch,
        },
        setLocalSearchTerm,
        setSelectedType,
        setTextInput,
        setDateRange,
        setShowAdvancedSearch,
        performSearch,
        getFilteredVehicles,
    };
};
