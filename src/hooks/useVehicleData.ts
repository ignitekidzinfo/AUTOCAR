/**
 * Custom hook for managing vehicle data fetching and state
 * Handles automatic refresh when returning from add/edit operations
 * Eliminates stale cache issues
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from 'utils/apiClient';
import { Vehicle, VehicleRow, PaginationState } from 'components/vehicle/types/VehicleListState';

const PAGE_SIZE = 25;

interface UseVehicleDataOptions {
    listType?: string | null;
    autoRefresh?: boolean;
}

interface UseVehicleDataReturn {
    vehicles: VehicleRow[];
    loading: boolean;
    initialLoad: boolean;
    error: string | null;
    pagination: PaginationState;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    markVehicleDeleted: (vehicleId: string) => void;
}

/**
 * Transform raw vehicle data to display rows
 */
const transformVehicleToRow = (vehicle: Vehicle, index: number): VehicleRow => ({
    id: vehicle.vehicleRegId || `vehicle-${index}`,
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
    hasInvoice: false, // Will be updated asynchronously
});

/**
 * Extract vehicle array from various API response formats
 */
const extractVehicles = (data: any): Vehicle[] => {
    if (Array.isArray(data)) {
        return data;
    }

    if (data?.content && Array.isArray(data.content)) {
        return data.content;
    }

    if (data?.data && Array.isArray(data.data)) {
        return data.data;
    }

    if (typeof data === 'object' && data.vehicleRegId) {
        return [data];
    }

    // Try to find any array in the response
    const possibleArrays = Object.values(data || {}).filter(val => Array.isArray(val)) as any[][];
    if (possibleArrays.length > 0) {
        return possibleArrays.reduce((a, b) => a.length > b.length ? a : b, []);
    }

    return [];
};

export const useVehicleData = (options: UseVehicleDataOptions = {}): UseVehicleDataReturn => {
    const { listType, autoRefresh = false } = options;

    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: PAGE_SIZE,
        hasMore: false,
    });

    const loadingRef = useRef(false);
    const mountedRef = useRef(true);
    const allVehiclesRef = useRef<Vehicle[]>([]);

    /**
     * Fetch vehicles from API
     * Always gets fresh data - no stale cache
     */
    const fetchVehicles = useCallback(async (page: number = 0, append: boolean = false): Promise<void> => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            // Build endpoint based on listType
            let endpoint = '/vehicle-reg/getAll';
            if (listType) {
                const statusFilter = listType === 'serviceQueue'
                    ? 'waiting,inprogress'
                    : listType === 'serviceHistory' ? 'complete' : '';
                endpoint = `/vehicle-reg/GetStatus?status=${statusFilter}`;
            }

            // Always fetch fresh data with cache-busting
            const cacheBuster = `_t=${Date.now()}`;
            const url = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;

            console.log(`Fetching fresh vehicle data from: ${url}`);
            const response = await apiClient.get(url);

            if (!mountedRef.current) return;

            const fetchedVehicles = extractVehicles(response.data);
            allVehiclesRef.current = fetchedVehicles;

            // Calculate pagination
            const totalCount = fetchedVehicles.length;
            const totalPages = Math.ceil(totalCount / PAGE_SIZE);
            const hasMore = page < totalPages - 1;

            // Get current page data
            const startIndex = page * PAGE_SIZE;
            const endIndex = startIndex + PAGE_SIZE;
            const pageVehicles = fetchedVehicles.slice(startIndex, endIndex);

            // Transform to rows
            const rows = pageVehicles.map((v, i) => transformVehicleToRow(v, startIndex + i));

            // Update state
            if (append) {
                setVehicles(prev => [...prev, ...rows]);
            } else {
                setVehicles(rows);
            }

            setPagination({
                currentPage: page,
                totalPages,
                totalElements: totalCount,
                pageSize: PAGE_SIZE,
                hasMore,
            });

            setError(null);
            console.log(`Loaded ${rows.length} vehicles (page ${page + 1}/${totalPages})`);

        } catch (err: any) {
            console.error('Error fetching vehicles:', err);
            if (mountedRef.current) {
                setError(err?.response?.data?.message || 'Failed to load vehicles. Please try again.');
            }
        } finally {
            if (mountedRef.current) {
                loadingRef.current = false;
                setLoading(false);
                setInitialLoad(false);
            }
        }
    }, [listType]);

    /**
     * Refresh - always fetches fresh data
     */
    const refresh = useCallback(async () => {
        console.log('Refreshing vehicle data...');
        await fetchVehicles(0, false);
    }, [fetchVehicles]);

    /**
     * Load more vehicles (pagination)
     */
    const loadMore = useCallback(async () => {
        if (!pagination.hasMore || loading) return;
        await fetchVehicles(pagination.currentPage + 1, true);
    }, [fetchVehicles, pagination.hasMore, pagination.currentPage, loading]);

    /**
     * Mark vehicle as deleted (optimistic update)
     */
    const markVehicleDeleted = useCallback((vehicleId: string) => {
        setVehicles(prev => prev.filter(v => v.vehicleRegId !== vehicleId));
        setPagination(prev => ({
            ...prev,
            totalElements: Math.max(0, prev.totalElements - 1),
        }));

        // Also update the ref
        allVehiclesRef.current = allVehiclesRef.current.filter(v => v.vehicleRegId !== vehicleId);
    }, []);

    /**
     * Initial load and auto-refresh on page visibility
     */
    useEffect(() => {
        mountedRef.current = true;

        // Check if we need to refresh because of add/edit operation
        const needsRefresh = sessionStorage.getItem('vehicleDataChanged') === 'true';
        if (needsRefresh) {
            console.log('Detected data change - fetching fresh data');
            sessionStorage.removeItem('vehicleDataChanged');
        }

        // Always fetch fresh data on mount
        fetchVehicles(0, false);

        // Listen for page visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && autoRefresh) {
                const dataChanged = sessionStorage.getItem('vehicleDataChanged') === 'true';
                if (dataChanged) {
                    console.log('Page visible and data changed - refreshing');
                    sessionStorage.removeItem('vehicleDataChanged');
                    fetchVehicles(0, false);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set up continuous polling if autoRefresh is enabled
        let pollingInterval: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            console.log('Auto-refresh enabled - polling every 10 seconds');
            pollingInterval = setInterval(() => {
                // Only poll if document is visible
                if (!document.hidden && mountedRef.current) {
                    console.log('Auto-refresh: fetching latest vehicle data...');
                    fetchVehicles(0, false);
                }
            }, 10000); // Poll every 10 seconds
        }

        return () => {
            mountedRef.current = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [fetchVehicles, autoRefresh]);

    return {
        vehicles,
        loading,
        initialLoad,
        error,
        pagination,
        refresh,
        loadMore,
        markVehicleDeleted,
    };
};

/**
 * Helper function to mark that vehicle data has changed
 * Call this before navigating to add/edit pages
 */
export const markVehicleDataChanged = () => {
    sessionStorage.setItem('vehicleDataChanged', 'true');
};
