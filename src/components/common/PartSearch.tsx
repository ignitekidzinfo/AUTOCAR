import React, { useState, useEffect, RefObject } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress
} from '@mui/material';
import apiClient from '../../Services/apiService';

interface SparePartDto {
  partName: string;
  partNumber: string;
  manufacturer: string;
  description?: string;
  buyingPrice?: number;
  price?: number;
  sparePartId?: number;
}

interface PartSearchProps {
  onPartSelect: (part: SparePartDto | null) => void;
  value?: SparePartDto | null;
  onNotFound?: (searchTerm: string) => void;
  onSearchTermChange?: (term: string) => void;
}

const PartSearch: React.FC<PartSearchProps> = ({ onPartSelect, value, onNotFound, onSearchTermChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SparePartDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePartDto | null>(value || null);
  
  // Reset search term when value prop changes to null
  useEffect(() => {
    if (value === null) {
      setSearchTerm('');
      setSelectedPart(null);
    } else if (value && value !== selectedPart) {
      setSelectedPart(value);
    }
  }, [value]);

  const fetchPartsBySearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Searching for:", query);
      const response = await apiClient.get(`/Filter/searchBarFilter?searchBarInput=${query}`);
      console.log("API response:", response.data);

      if (Array.isArray(response.data)) {
        const parts = response.data.map((part: any) => ({
          partName: part.partName || '',
          partNumber: part.partNumber || '',
          manufacturer: part.manufacturer || '',
          description: part.description || '',
          buyingPrice: part.buyingPrice,
          price: part.price,
          sparePartId: part.sparePartId
        }));
        console.log("Mapped parts:", parts);
        setSuggestions(parts);
        
        // Only call onNotFound if we have a search term and no results
        if (parts.length === 0 && onNotFound && query.trim().length > 0) {
          onNotFound(query);
        }
      } else if (response.data && Array.isArray(response.data.content)) {
        const parts = response.data.content.map((part: any) => ({
          partName: part.partName || '',
          partNumber: part.partNumber || '',
          manufacturer: part.manufacturer || '',
          description: part.description || '',
          buyingPrice: part.buyingPrice,
          price: part.price,
          sparePartId: part.sparePartId
        }));
        console.log("Mapped parts from content:", parts);
        setSuggestions(parts);
        
        // Only call onNotFound if we have a search term and no results
        if (parts.length === 0 && onNotFound && query.trim().length > 0) {
          onNotFound(query);
        }
      } else {
        console.log("API response is not an array or doesn't have content array");
        setSuggestions([]);
        
        // Only call onNotFound if we have a search term
        if (onNotFound && query.trim().length > 0) {
          onNotFound(query);
        }
      }
    } catch (error) {
      console.error("Error fetching parts:", error);
      setSuggestions([]);
      
      // Only call onNotFound if we have a search term
      if (onNotFound && query.trim().length > 0) {
        onNotFound(query);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setSearchTerm(value);
    // Call the onSearchTermChange prop if provided
    if (onSearchTermChange) {
      onSearchTermChange(value);
    }
    if (value.trim() !== '') {
    fetchPartsBySearch(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleChange = (_event: React.SyntheticEvent, value: string | SparePartDto | null) => {
    if (typeof value === 'string') {
      const customPart: SparePartDto = {
        partName: value,
        partNumber: '',
        manufacturer: '',
      };
      setSelectedPart(customPart);
      onPartSelect(customPart);
    } else {
      console.log("Selected part from dropdown:", value);
      setSelectedPart(value);
      onPartSelect(value);
      
      // Clear search term after selection to prevent showing the previous selection
      if (value === null) {
        setSearchTerm('');
        // Call the onSearchTermChange prop if provided
        if (onSearchTermChange) {
          onSearchTermChange('');
        }
      }
    }
  };

  return (
    <Autocomplete
      key={selectedPart ? 'selected' : 'empty'} // Force re-render when selection changes
      freeSolo
      loading={isLoading}
      loadingText="Searching..."
      noOptionsText={onNotFound ? "No parts found. Press Enter to create new part." : "No parts found"}
      options={suggestions}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return `${option.manufacturer || ''} - ${option.partName || ''} - ${option.partNumber || ''}`;
      }}
      filterOptions={(x) => x}
      inputValue={searchTerm}
      onInputChange={handleInputChange}
      onChange={handleChange}
      value={value}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.partNumber === value.partNumber || 
               option.sparePartId === value.sparePartId;
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <div>
            <strong>{option.manufacturer || ''}</strong> - {option.partName || ''}
            <br />
            <small>Part #: {option.partNumber || ''}</small>
            {option.description && <small> - {option.description}</small>}
            {option.buyingPrice && <small> - Price: {option.buyingPrice}</small>}
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search Parts"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
              height: '40px',
              padding: '0',
              '& .MuiInputBase-input': {
                padding: { xs: '7px 8px', sm: '8.5px 14px' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              },
              borderRadius: 0, // Make it square
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm && suggestions.length === 0 && onNotFound) {
              onNotFound(searchTerm);
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 0, // Make input square
              height: '40px'
            },
            width: '100%'
          }}
        />
      )}
      sx={{
        width: '100%',
        '& .MuiAutocomplete-inputRoot': {
          padding: '0 !important'
        }
      }}
    />
  );
};

export default PartSearch; 