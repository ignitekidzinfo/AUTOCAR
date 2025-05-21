import apiClient from "../Services/apiService";

export interface SparePart {
  partName: string;
  partNumber: string;
  manufacturer: string;
  description?: string;
}

/**
 * Searches for spare parts based on the provided query
 * @param query The search query
 * @returns An array of spare parts that match the query
 */
export const searchParts = async (query: string): Promise<SparePart[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    console.log("Searching for parts with query:", query);
    const response = await apiClient.get(`/Filter/searchBarFilter?searchBarInput=${query}`);
    console.log("API response:", response.data);

    if (Array.isArray(response.data)) {
      // Map response data to SparePart interface
      return response.data.map((part: any) => ({
        partName: part.partName || '',
        partNumber: part.partNumber || '',
        manufacturer: part.manufacturer || '',
        description: part.description || ''
      }));
    }
    
    console.warn("API response is not an array:", response.data);
    return [];
  } catch (error) {
    console.error("Error searching for parts:", error);
    return [];
  }
} 