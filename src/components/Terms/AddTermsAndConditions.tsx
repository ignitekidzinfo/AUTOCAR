import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  SelectChangeEvent,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { useNotification } from '../common/Notification';
import logger from '../../utils/logger';

interface TermsDto {
  manageTermsId?: number;
  selectNoteOn: string;
  writeTerms: string;
}

const AddTermsAndConditions: React.FC = () => {
  const [formData, setFormData] = useState<TermsDto>({
    selectNoteOn: 'Job Card',
    writeTerms: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchTermById(parseInt(id));
    }
  }, [id]);

  const fetchTermById = async (termId: number) => {
    try {
      setLoading(true);
      
      const response = await apiClient.get(`manageTerms/getById?id=${termId}`);
      
      if (response.data && response.data.data) {
        const termData = response.data.data;
        setFormData({
          manageTermsId: termData.manageTermsId,
          selectNoteOn: termData.selectNoteOn || 'Job Card',
          writeTerms: termData.writeTerms || ''
        });
      } else {
        showNotification({
          message: 'Failed to fetch terms and condition: Invalid data format',
          type: 'error',
        });
        navigate('/admin/manage-Terms');
      }
    } catch (error) {
      logger.error('Error fetching terms and condition:', error);
      showNotification({
        message: 'Failed to fetch terms and condition',
        type: 'error',
      });
      navigate('/admin/manage-Terms');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectNoteOn.trim()) {
      newErrors.selectNoteOn = 'Note On is required';
    }
    
    if (!formData.writeTerms.trim()) {
      newErrors.writeTerms = 'Terms & Conditions content is required';
    } else if (formData.writeTerms.trim().length < 10) {
      newErrors.writeTerms = 'Terms & Conditions content should be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (isEdit) {
        response = await apiClient.put(`manageTerms/update?id=${id}`, formData);
      } else {
        response = await apiClient.post('manageTerms/create', formData);
      }
      
      if (response.data) {
        showNotification({
          message: `Terms and condition ${isEdit ? 'updated' : 'created'} successfully`,
          type: 'success',
        });
        
        // Reset the form only for new entries, not for edits
        if (!isEdit) {
          setFormData({
            selectNoteOn: 'Job Card',
            writeTerms: '',
          });
        }
        
        // Small delay before navigation to ensure notification is seen
        setTimeout(() => {
          navigate('/admin/manage-Terms');
        }, 1000);
      } else {
        showNotification({
          message: response.data?.message || `Failed to ${isEdit ? 'update' : 'create'} terms and condition`,
          type: 'error',
        });
      }
    } catch (error) {
      logger.error(`Error ${isEdit ? 'updating' : 'creating'} terms and condition:`, error);
      showNotification({
        message: `Failed to ${isEdit ? 'update' : 'create'} terms and condition`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user selects
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleReset = () => {
    if (isEdit && id) {
      fetchTermById(parseInt(id));
    } else {
      setFormData({
        selectNoteOn: 'Job Card',
        writeTerms: '',
      });
    }
    setErrors({});
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        '& .MuiBox-root': {
          maxWidth: '100%',
          overflow: 'visible'
        },
        '& .MuiInputBase-root': {
          overflow: 'hidden'
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 3 
        }}>
          <IconButton onClick={() => navigate('/admin/manage-Terms')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {isEdit ? 'Edit Terms & Condition' : 'Add New Terms & Condition'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box component="form" onSubmit={handleSubmit} sx={{ 
              mt: 2,
              width: '100%',
              '& .MuiFormControl-root': {
                width: '100%'
              }
            }}>
              <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.selectNoteOn}>
                <InputLabel id="selectNoteOn-label">Select Note On *</InputLabel>
                <Select
                  labelId="selectNoteOn-label"
                  id="selectNoteOn"
                  name="selectNoteOn"
                  value={formData.selectNoteOn || "Job Card"}
                  label="Select Note On *"
                  onChange={handleSelectChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="Job Card">Job Card</MenuItem>
                </Select>
                {errors.selectNoteOn && <FormHelperText>{errors.selectNoteOn}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.writeTerms}>
                <InputLabel htmlFor="writeTerms" shrink>Write Terms & Condition *</InputLabel>
                
                <textarea 
                  id="writeTerms"
                  name="writeTerms"
                  value={formData.writeTerms || ''}
                  onChange={(e) => handleChange(e as any)}
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.writeTerms ? '1px solid red' : '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    marginTop: '8px'
                  }}
                />
                
                {errors.writeTerms && (
                  <FormHelperText error>{errors.writeTerms}</FormHelperText>
                )}
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? <CircularProgress size={24} /> : (isEdit ? 'Update' : 'Submit')}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  onClick={() => navigate('/admin/manage-Terms')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          ©{new Date().getFullYear()} Auto Car Care Point
        </Typography>
      </Box>
    </Box>
  );
};

export default AddTermsAndConditions; 