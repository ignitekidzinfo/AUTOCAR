import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "Services/apiService";
import { motion } from "framer-motion";
import { FiAlertCircle, FiX, FiSearch } from "react-icons/fi";
import React from "react";
import storageUtils from '../utils/storageUtils';

const FiXIcon = FiX as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;
const FiAlertCircleIcon = FiAlertCircle as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;
const FiSearchIcon = FiSearch as React.FC<{ size?: number } & React.SVGProps<SVGSVGElement>>;

interface SparePartType {
  sparePartId: number;
  partName: string;
  manufacturer: string;
  price: number;
  photo?: string[];
}

function SparePart() {
  const [spareParts, setSpareParts] = useState<SparePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const size = 30; 

  const navigate = useNavigate();

  let userRole: string = "";
  const userData = storageUtils.getUserData();
  if (userData) {
    userRole = userData.authorities?.[0] || "";
  }

  useEffect(() => {
    // Only search if there's a query with at least 2 characters
    if (searchQuery && searchQuery.length >= 2) {
      setCurrentPage(0);
      fetchSpareParts(0);
    } else if (searchQuery === "") {
      
      setCurrentPage(0);
      fetchSpareParts(0);
    }
    // Don't trigger for 1 character searches (too many results)
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
    }
    setCurrentPage(0);
    fetchSpareParts(0);
  };

  // Add a separate debug function for search results
  const processSearchResults = (data: any) => {
    // Enhanced filtering function 
    const filterNonDeleted = (items: any[]) => {
      if (!items || !Array.isArray(items)) return [];
      
      // Ensure we're consistently filtering out deleted items
      return items.filter((part: any) => {
        // Check various possible deletion flags that might exist
        const isDeleted = 
          part.isDeleted === true || 
          part.deleted === true || 
          part.status === "DELETED" || 
          part.status === "INACTIVE";
          
        return !isDeleted;
      });
    };
    
    console.log("Processing search results:", data);
    
    // Handle different response formats consistently
    if (data && Array.isArray(data.content)) {
      return filterNonDeleted(data.content);
    } 
    else if (data && Array.isArray(data.list)) {
      return filterNonDeleted(data.list);
    }
    else if (data && Array.isArray(data)) {
      return filterNonDeleted(data);
    }
    
    console.log("No valid data format found in response");
    return [];
  };

  // Load data when component mounts
  useEffect(() => {
    fetchSpareParts();
  }, []);

  const fetchSpareParts = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      let url = "";
      const isSearchQuery = searchQuery.trim().length > 0;
      
      // Ensure the includeDeleted=false parameter is always included and correct
      if (isSearchQuery) {
        url = `/Filter/searchBarFilter?searchBarInput=${encodeURIComponent(
          searchQuery
        )}&page=${page}&size=${size}&includeDeleted=false`;
      } else {
        url = `/sparePartManagement/getAll?page=${page}&size=${size}&includeDeleted=false`;
      }

      // Add a timestamp parameter to prevent caching
      url += `&_t=${Date.now()}`;

      try {
        console.log("Fetching spare parts from URL:", url);
        const response = await apiClient.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
       
        console.log("Raw response data:", response.data);
        
        // Process the results based on the response format
        const processedParts = processSearchResults(response.data);
        console.log("Processed parts:", processedParts);
        
        setSpareParts(processedParts);
        
        // Set pagination based on response format
        if (response.data && response.data.totalPages !== undefined) {
          setTotalPages(response.data.totalPages);
          setCurrentPage(response.data.currentPage || 0);
        } else {
          // If no pagination info, assume it's all on one page
          setTotalPages(1);
          setCurrentPage(0);
        }
        
        if (processedParts.length === 0 && isSearchQuery) {
          setError(`No spare parts found for the given search keyword.`);
        }
      } catch (apiErr: any) {
        
        if (apiErr.response?.status === 404 && 
            apiErr.response?.data?.includes?.("No spare parts found") || 
            apiErr.response?.data === "No spare parts found for the given search keyword.") {
          setError("No spare parts found for the given search keyword.");
        } else {
          // For other actual errors
          const errMsg =
            apiErr.response?.data?.exception ||
            apiErr.response?.data?.message ||
            apiErr.response?.data ||
            "Something went wrong. Please try again later.";
          setError(errMsg);
        }
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSpareParts(page);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers: number[] = [];
    const maxDisplayed = 5; 

    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxDisplayed - 1);
    if (endPage - startPage < maxDisplayed - 1) {
      startPage = Math.max(0, endPage - maxDisplayed + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-6">
        <nav>
          <ul className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-1 rounded-md bg-blue-500 text-white disabled:opacity-50"
              >
                Prev
              </button>
            </li>

            {startPage > 0 && (
              <>
                <li>
                  <button
                    onClick={() => handlePageChange(0)}
                    className="px-3 py-1 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-100"
                  >
                    1
                  </button>
                </li>
                {startPage > 1 && <li className="px-2">...</li>}
              </>
            )}

            {pageNumbers.map((pageNum) => (
              <li key={pageNum}>
                <button
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white"
                      : "border-blue-500 text-blue-500 hover:bg-blue-100"
                  }`}
                >
                  {pageNum + 1}
                </button>
              </li>
            ))}

            {endPage < totalPages - 1 && (
              <>
                {endPage < totalPages - 2 && <li className="px-2">...</li>}
                <li>
                  <button
                    onClick={() => handlePageChange(totalPages - 1)}
                    className="px-3 py-1 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-100"
                  >
                    {totalPages}
                  </button>
                </li>
              </>
            )}

            <li>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 rounded-md bg-blue-500 text-white disabled:opacity-50"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Spare Parts
      </h1>

      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.keyCode === 13) {
                  handleSearch();
                }
              }}
              placeholder="Search spare parts..."
              className="w-80 border border-gray-300 p-2 rounded-l-lg pr-10 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <FiXIcon />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-[40vh]"
        >
          {error.includes("No spare parts found") ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-full p-6 mb-5">
                <FiSearchIcon className="text-blue-500" size={48} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Results Found</h2>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {error}
              </p>
            </>
          ) : (
            <>
              <FiAlertCircleIcon className="text-red-500 mb-4" size={64} />
              <p className="text-red-500 text-lg mb-6">{error}</p>
            </>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => fetchSpareParts(currentPage)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Retry
            </button>
            <button
              onClick={() => {
                setSearchQuery("");
              }}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Clear Search
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {spareParts.length > 0 ? (
              spareParts.map((sparePart, index) => (
                <div
                  key={sparePart.sparePartId || `spare-part-${index}`}
                  className="bg-white rounded-lg border border-gray-300 overflow-hidden transition-transform hover:-translate-y-2 hover:scale-105 cursor-pointer shadow-lg"
                  onClick={() => {
                    if (sparePart.sparePartId && userRole) {
                      navigate(`/spare-part/${sparePart.sparePartId}`);
                    } else {
                      navigate("/signIn");
                    }
                  }}
                >
                  <div className="relative w-full aspect-video bg-gray-100 p-3">
                    {sparePart.photo && sparePart.photo.length > 0 ? (
                      <img
                        src={`data:image/jpeg;base64,${sparePart.photo[0]}`}
                        alt={sparePart.partName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.jpg";
                        }}
                      />
                    ) : (
                      <img
                        src="/placeholder.jpg"
                        alt="Placeholder"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {sparePart.partName}
                    </h2>
                    <p className="text-gray-600 text-sm mb-1">
                      Manufacturer: {sparePart.manufacturer}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Price: ₹{sparePart.price}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No spare parts available.
              </p>
            )}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}

export default SparePart;
