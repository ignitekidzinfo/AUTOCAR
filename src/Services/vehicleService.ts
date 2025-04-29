import { filter } from "types/SparePart";
import apiClient from "./apiService";
import { VehicleFormData } from "types/Vahicle";

export const VehicleListData = async () => {
    try {
      const response = await apiClient.get("/vehicle-reg/getAll");
      return response.data;
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  };

  export const VehicleAdd = async (vData : VehicleFormData) => {
    try {
      const response = await apiClient.post("/vehicle-reg/add" , vData);
      return response.data;
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  };

  export const VehicleDataByID = async (VID : string | number) => {
    try {
      const response = await apiClient.get(`vehicle-reg/getById?vehicleRegId=${VID}` );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  };
  
  export const VehicleUpdate = async ( vData : VehicleFormData) => {
    try{
      const response = await apiClient.patch(`vehicle-reg/update?vehicleRegId=${vData.vehicleRegId}` , vData);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  export const VehicleDelete = async ( vehicleRegId : number | number) => {
    try{
      const response = await apiClient.put(`vehicle-reg/delete?vehicleRegId=${vehicleRegId}`);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  export const VehicleSperPartDelete = async ( vehicleSparePartId : number | number) => {
    try{
      const response = await apiClient.delete(`sparePartTransactions/delete?transactionId=${vehicleSparePartId}`);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  export const GetVehicleByAppointmentID = async ( filterData : filter) => {
    try{
      const response = await apiClient.get(`vehicle-reg/getByAppointmentId?appointmentId=${filterData.appointmentId}`);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  export const GetVehicleByDateRange = async ( filterData : filter) => {
    try{
      const response = await apiClient.get(`vehicle-reg/date-range?startDate=${filterData.startDate}&endDate=${filterData.endDate}`);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }

  export const GetVehicleByStatus = async ( filterData : filter) => {
    try{
      const response = await apiClient.get(`vehicle-reg/GetStatus?status=${filterData.status}`);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }