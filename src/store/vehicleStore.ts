import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VehicleListData, GetVehicleByStatus } from 'Services/vehicleService';
import { debounce } from 'lodash';
import logger from 'utils/logger';
import { filter } from 'types/SparePart';

// Types
export interface Vehicle {
  vehicleRegId: string;
  vehicleNumber?: string;
  vehicleNoName?: string;
  customerName?: string;
  customerMobile?: string;
  customerMobileNumber?: string;
  advancePayment?: number;
  kmsDriven?: number;
  kilometer?: number;
  superwiser?: string;
  technician?: string;
  worker?: string;
  status?: string;
  date?: string;
  hasInvoice?: boolean;
}

export interface VehicleFilters {
  status: string | null;
  searchQuery: string;
  dateRange: [Date | null, Date | null];
  appointmentId: string | null;
}

export interface VehicleStoreState {
  // Vehicle data
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  
  // Pagination
  page: number;
  totalPages: number;
  pageSize: number;
  
  // Filters
  filters: VehicleFilters;
  
  // Actions
  fetchVehicles: (forceRefresh?: boolean) => Promise<void>;
  setFilters: (filters: Partial<VehicleFilters>) => void;
  applyFilters: () => void;
  selectVehicle: (id: string | null) => void;
  clearFilters: () => void;
  updateVehicle: (vehicle: Partial<Vehicle> & { vehicleRegId: string }) => void;
  deleteVehicle: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

// Create a store creator function that matches our type definitions
const createVehicleStore = (
  setState: (partial: VehicleStoreState | Partial<VehicleStoreState> | ((state: VehicleStoreState) => VehicleStoreState | Partial<VehicleStoreState>), replace?: boolean) => void,
  getState: () => VehicleStoreState
): VehicleStoreState => {
  return {
    // Initial state
    vehicles: [] as Vehicle[],
    filteredVehicles: [] as Vehicle[],
    selectedVehicle: null,
    isLoading: false,
    error: null,
    lastUpdated: 0,
    page: 0,
    totalPages: 0,
    pageSize: 25,
    
    filters: {
      status: null,
      searchQuery: '',
      dateRange: [null, null] as [Date | null, Date | null],
      appointmentId: null
    },
    
    // Fetch vehicles with intelligent caching
    fetchVehicles: async (forceRefresh = false) => {
      const currentState = getState();
      const now = Date.now();
      
      // Check if we need to refresh data
      // Only refresh if forced, if data is older than 30 seconds, or if we have no data
      const needsRefresh = forceRefresh || 
        (now - currentState.lastUpdated > 30000) || 
        currentState.vehicles.length === 0;
      
      if (!needsRefresh) {
        logger.debug('Using cached vehicle data');
        return;
      }
      
      setState({ isLoading: true, error: null });
      
      try {
        // Apply status filter if any
        const { status } = currentState.filters;
        let data;
        
        if (status) {
          // Create a filter object matching the expected type
          const filterData: filter = { status };
          data = await GetVehicleByStatus(filterData);
        } else {
          data = await VehicleListData();
        }
        
        setState({ 
          vehicles: data, 
          lastUpdated: now,
          isLoading: false
        });
        
        // Apply any existing filters to the new data
        getState().applyFilters();
        
      } catch (error) {
        logger.error('Error fetching vehicles:', error);
        setState({ 
          error: 'Failed to load vehicles. Please try again.',
          isLoading: false
        });
      }
    },
    
    // Apply all current filters to the vehicles
    applyFilters: debounce(() => {
      const { vehicles, filters } = getState();
      const { searchQuery, status, dateRange, appointmentId } = filters;
      
      let result = [...vehicles];
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(v => 
          (v.vehicleNumber?.toLowerCase().includes(query)) || 
          (v.vehicleNoName?.toLowerCase().includes(query)) ||
          (v.customerName?.toLowerCase().includes(query)) ||
          (v.customerMobile?.toLowerCase().includes(query)) ||
          (v.customerMobileNumber?.toLowerCase().includes(query))
        );
      }
      
      // Filter by status
      if (status) {
        result = result.filter(v => v.status?.toLowerCase() === status.toLowerCase());
      }
      
      // Filter by date range
      if (dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].getTime();
        const endDate = dateRange[1].getTime();
        
        result = result.filter(v => {
          if (!v.date) return false;
          const vehicleDate = new Date(v.date).getTime();
          return vehicleDate >= startDate && vehicleDate <= endDate;
        });
      }
      
      // Filter by appointment ID
      if (appointmentId) {
        result = result.filter(v => v.vehicleRegId === appointmentId);
      }
      
      // Update the filtered results
      setState({ 
        filteredVehicles: result,
        totalPages: Math.ceil(result.length / getState().pageSize)
      });
    }, 200),
    
    // Update filters
    setFilters: (newFilters: Partial<VehicleFilters>) => {
      setState((state: VehicleStoreState) => ({
        filters: {
          ...state.filters,
          ...newFilters
        }
      }));
      
      // Apply the updated filters
      getState().applyFilters();
    },
    
    // Clear all filters
    clearFilters: () => {
      setState({
        filters: {
          status: null,
          searchQuery: '',
          dateRange: [null, null] as [Date | null, Date | null],
          appointmentId: null
        },
        page: 0
      });
      
      // Re-apply filters (effectively clearing them)
      getState().applyFilters();
    },
    
    // Select a vehicle by ID
    selectVehicle: (id: string | null) => {
      if (!id) {
        setState({ selectedVehicle: null });
        return;
      }
      
      const { vehicles } = getState();
      const vehicle = vehicles.find(v => v.vehicleRegId === id) || null;
      setState({ selectedVehicle: vehicle });
    },
    
    // Update a vehicle in the store
    updateVehicle: (vehicle: Partial<Vehicle> & { vehicleRegId: string }) => {
      const { vehicles } = getState();
      
      const updatedVehicles = vehicles.map(v => 
        v.vehicleRegId === vehicle.vehicleRegId 
          ? { ...v, ...vehicle } 
          : v
      );
      
      setState({ 
        vehicles: updatedVehicles,
        lastUpdated: Date.now()
      });
      
      // If we're updating the selected vehicle, update that too
      const { selectedVehicle } = getState();
      if (selectedVehicle && selectedVehicle.vehicleRegId === vehicle.vehicleRegId) {
        setState({ 
          selectedVehicle: { ...selectedVehicle, ...vehicle }
        });
      }
      
      // Re-apply filters with updated data
      getState().applyFilters();
    },
    
    // Delete a vehicle from the store
    deleteVehicle: async (id: string) => {
      setState((state: VehicleStoreState) => ({
        vehicles: state.vehicles.filter(v => v.vehicleRegId !== id),
        lastUpdated: Date.now()
      }));
      
      // Clear selected vehicle if it's the one being deleted
      const { selectedVehicle } = getState();
      if (selectedVehicle && selectedVehicle.vehicleRegId === id) {
        setState({ selectedVehicle: null });
      }
      
      // Re-apply filters with updated data
      getState().applyFilters();
    },
    
    // Set page for pagination
    setPage: (page: number) => {
      setState({ page });
    }
  };
};

// Create the store with persistence
const useVehicleStore = create<VehicleStoreState>(
  persist(
    createVehicleStore,
    {
      name: 'vehicle-store', // name of the item in storage
      partialize: (state: VehicleStoreState) => ({ 
        // Only persist these fields
        vehicles: state.vehicles,
        lastUpdated: state.lastUpdated,
        filters: state.filters,
        page: state.page
      }),
    }
  )
);

export default useVehicleStore; 