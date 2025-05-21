import React, { useState } from 'react';
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
}

interface PartSearchProps {
  onPartSelect: (part: SparePartDto | null) => void;
}

const PartSearch: React.FC<PartSearchProps> = ({ onPartSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SparePartDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePartDto | null>(null);

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
          description: part.description || ''
        }));
        console.log("Mapped parts:", parts);
        setSuggestions(parts);
      } else {
        console.log("API response is not an array");
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching parts:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setSearchTerm(value);
    fetchPartsBySearch(value);
  };

  const handleChange = (_event: React.SyntheticEvent, value: string | SparePartDto | null) => {
    if (typeof value === 'string') {
      // If the user entered a string, create a custom part
      const customPart: SparePartDto = {
        partName: value,
        partNumber: '',
        manufacturer: '',
      };
      setSelectedPart(customPart);
      onPartSelect(customPart);
    } else {
      setSelectedPart(value);
      onPartSelect(value);
    }
  };

  return (
    <Autocomplete
      freeSolo
      loading={isLoading}
      loadingText="Searching..."
      noOptionsText="No parts found"
      options={suggestions}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return `${option.manufacturer} - ${option.partName} - ${option.partNumber}`;
      }}
      filterOptions={(x) => x} // Don't filter, API already filtered
      inputValue={searchTerm}
      onInputChange={handleInputChange}
      onChange={handleChange}
      value={selectedPart}
      renderOption={(props, option) => (
        <li {...props}>
          <div>
            <strong>{option.manufacturer}</strong> - {option.partName}
            <br />
            <small>Part #: {option.partNumber}</small>
            {option.description && <small> - {option.description}</small>}
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Parts"
          placeholder="Type at least 2 characters to search"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default PartSearch; 