import apiClient from "./apiService";
import { SparePartData } from "../types/SparePart";
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

  export const SparePartGetByID = async (SPID : string | number) => {
    try {
      const response = await apiClient.get(`/sparePartManagement/getPartById/${SPID}` );
      return response.data;
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  };
  
  export const SparePartUpdate = async ( SPData : SparePartData) => {
    try{
      const response = await apiClient.post(`sparePartTransactions/update?transactionId=${SPData.id}` , SPData);
      return response.data;
    }catch(error) { 
      console.error("Error fetching spare parts:", error);
      throw new Error("Failed to fetch spare parts");
    }
  }