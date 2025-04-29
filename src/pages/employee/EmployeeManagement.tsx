import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Grid,
  SelectChangeEvent,
  FormGroup,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../components/common/Notification';
import { apiClient } from '../../utils/apiClient';

interface EmployeeForm {
  name: string;
  position: string;
  contact: string;
  address: string;
  email: string;
  username: string;
  password: string;
  userId?: number;
}

interface BaseResponseDTO {
  code: string;
  message: string;
}

interface EmployeeDTO extends EmployeeForm {
  componentNames: string[];
}

const EmployeeManagement: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const isEditMode = !!userId;
  
  console.log('Component rendering with params:', { userId, isEditMode });
  
  const [formData, setFormData] = useState<EmployeeForm>({
    name: '',
    position: '',
    contact: '',
    address: '',
    email: '',
    username: '',
    password: '',
    userId: undefined,
  });

  const [componentNames, setComponentNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Fetch employee data if in edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      console.log('Edit mode detected with ID:', userId);
      const fetchEmployeeData = async () => {
        setFetchLoading(true);
        try {
          console.log('Fetching employee data for ID:', userId);
          const response = await apiClient.get<EmployeeDTO>(`/api/employees/getById/${userId}`);
          console.log('Employee data received:', response.data);
          const employeeData = response.data;
          
          setFormData({
            name: employeeData.name || '',
            position: employeeData.position || '',
            contact: employeeData.contact || '',
            address: employeeData.address || '',
            email: employeeData.email || '',
            username: employeeData.username || '',
            password: employeeData.password || '',
            userId: employeeData.userId || undefined,
          });
          
          if (employeeData.componentNames) {
            setComponentNames(employeeData.componentNames);
          }
          
        } catch (error) {
          console.error('Error fetching employee data:', error);
          showNotification({
            message: 'Failed to load employee data',
            type: 'error',
          });
        } finally {
          setFetchLoading(false);
        }
      };
      
      fetchEmployeeData();
    }
  }, [userId, isEditMode, showNotification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const handlePositionChange = (e: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      position: e.target.value,
    }));
    
    setTouchedFields(prev => ({
      ...prev,
      position: true
    }));
  };

  const handleComponentChange = (component: string) => {
    setComponentNames((prev) => {
      if (prev.includes(component)) {
        return prev.filter((p) => p !== component);
      }
      return [...prev, component];
    });
  };

  // Validation functions
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateContactNumber = (contact: string) => {
    return /^\d{10}$/.test(contact);
  };

  // Get error states
  const getFieldError = (fieldName: string) => {
    if (!formSubmitted && !touchedFields[fieldName]) return false;
    
    switch (fieldName) {
      case 'name':
        return !formData.name;
      case 'position':
        return !formData.position;
      case 'contact':
        return formData.contact ? !validateContactNumber(formData.contact) : false;
      case 'address':
        return !formData.address;
      case 'email':
        return !formData.email || !validateEmail(formData.email);
      case 'username':
        return !formData.username;
      case 'password':
        return !formData.password || formData.password.length < 6;
      default:
        return false;
    }
  };

  // Get helper text
  const getHelperText = (fieldName: string) => {
    if (!formSubmitted && !touchedFields[fieldName]) return '';
    
    switch (fieldName) {
      case 'name':
        return !formData.name ? 'Name is required' : '';
      case 'position':
        return !formData.position ? 'Position is required' : '';
      case 'contact':
        return formData.contact && !validateContactNumber(formData.contact) 
          ? 'Contact must be a 10-digit number' 
          : '';
      case 'address':
        return !formData.address ? 'Address is required' : '';
      case 'email':
        if (!formData.email) return 'Email is required';
        if (!validateEmail(formData.email)) return 'Please enter a valid email';
        return '';
      case 'username':
        return !formData.username ? 'Username is required' : '';
      case 'password':
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    // Validate all fields
    const isNameValid = !!formData.name;
    const isPositionValid = !!formData.position;
    const isAddressValid = !!formData.address;
    const isEmailValid = !!formData.email && validateEmail(formData.email);
    const isUsernameValid = !!formData.username;
    const isPasswordValid = isEditMode || (!!formData.password && formData.password.length >= 6);
    const isContactValid = !formData.contact || validateContactNumber(formData.contact);
    
    if (!isNameValid || !isPositionValid || !isAddressValid || !isEmailValid || 
        !isUsernameValid || !isPasswordValid || !isContactValid) {
      showNotification({ message: 'Please fix the errors in the form', type: 'error' });
      return;
    }

    const employeeDTO: EmployeeDTO = {
      ...formData,
      componentNames,
    };

    // For new employees, generate a random userId
    if (!isEditMode) {
      employeeDTO.userId = Math.floor(Math.random() * 1000) + 100;
    }

    setIsLoading(true);
    try {
      let response;
      
      if (isEditMode) {
        // Use PATCH for updates with the employee's ID
        const updates = {
          ...employeeDTO,
          id: parseInt(userId!, 10)
        };
        response = await apiClient.patch<BaseResponseDTO>(
          `/api/employees/update/${userId}`,
          updates
        );
      } else {
        // Use POST for new employees
        response = await apiClient.post<BaseResponseDTO>(
          '/api/employees/add',
          employeeDTO
        );
      }

      if (response.data.code === '200' || response.status === 200) {
        showNotification({ 
          message: isEditMode ? 'Employee updated successfully' : 'Employee created successfully', 
          type: 'success' 
        });
        handleReset();
        navigate('/admin/employeelist');
      } else {
        showNotification({ 
          message: response.data.message || (isEditMode ? 'Failed to update employee' : 'Failed to create employee'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error(isEditMode ? 'Error updating employee:' : 'Error creating employee:', error);
      showNotification({ 
        message: error instanceof Error ? error.message : (isEditMode ? 'Failed to update employee' : 'Failed to create employee'),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      position: '',
      contact: '',
      address: '',
      email: '',
      username: '',
      password: '',
      userId: undefined,
    });
    setComponentNames([]);
    setFormSubmitted(false);
    setTouchedFields({});
  };

  // Permissions list with descriptions of what each permission grants access to
  const permissionsList = [
    'Dashboard', // Can access none of the components
    'Manage User', // Can access manage user tab in side menu
    'Manage Services', // Access to service queue but NOT the spanner icon inside
    'Manage Repairs', // The spanner icon inside the service queue will be accessible
    'Manage Spares Inventory', // Manage spares tab in side menu will be accessible
    'Manage Supplier', // Manage supplier tab in the side menu will be accessible
    'Manage Customer', // Manage customer tab in side menu will be accessible
    'Purchase', // Purchase card on dashboard will be accessible
    'Job Sales Report', // In side menu under report tab job sale report tab will be accessible
    'Counter Sales Report', // In side menu under report tab counter sale report tab will be accessible
    'Purchase Report', // In side menu under report tab purchase report tab will be accessible
    'Vehicle Registration', // Vehicle registration card on dashboard will be accessible
    'Bookings', // Bookings card on dashboard will be accessible
    'Service Queue', // Service Queue card on dashboard will be accessible
    'Service History', // Service History card on dashboard will be accessible
    'Counter Sale', // Counter sale card on dashboard will be accessible
    'Job Card', // Access to job card functionality
    'Spares', // Access to spares functionality
    'Services', // Access to services functionality
    'Sale Account Report', // In side menu under report tab Sale Account Report tab will be accessible
    'Purchase Account Report', // In side menu under report tab Purchase Account Report tab will be accessible
    'Manage Stock', // In side menu under master tab manage spares tab's "view all stock" card will be accessible
    'Manage Sale', // Access to manage sale functionality
    'Customer Payment', // In side menu under payments tab customer payment tab will be accessible
    'Bank Deposit', // In side menu under payments tab Bank Deposit tab will be accessible
    'Employee Payment', // In side menu under payments tab Employee Payment tab will be accessible
    'Manage Notes', // In side menu under master tab Manage Notes tab will be accessible
    'Superwiser/Technician Service Report', // In side menu under report tab Superwiser/Technician Service Report tab will be accessible
    'Quotation', // In dashboard quotation card will be accessible
    'Manage Insurance', // In dashboard insurance card will be accessible
    'Spare Sale Stock', // Access to spare sale stock functionality
    'Manage Terms & Conditions', // In side menu under master tab Manage Terms & Conditions tab will be accessible
    'Vehicle History' // In side menu under Report tab Vehicle History tab will be accessible
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          {isEditMode ? 'Edit Employee' : 'Add New User'}
        </Typography>
        {fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={12} md={5}>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  error={getFieldError('name')}
                  helperText={getHelperText('name')}
                  size="small"
                />
                
                <FormControl fullWidth required error={getFieldError('position')} size="small">
                  <Select
                    value={formData.position}
                    onChange={handlePositionChange}
                    onBlur={() => handleBlur('position')}
                    displayEmpty
                    name="position"
                  >
                    <MenuItem value="" disabled>Select Position</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="technician">Technician</MenuItem>
                    <MenuItem value="staff">Worker</MenuItem>
                  </Select>
                  {getFieldError('position') && <FormHelperText>Position is required</FormHelperText>}
                </FormControl>

                <TextField
                  fullWidth
                  label="Contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('contact')}
                  error={getFieldError('contact')}
                  helperText={getHelperText('contact')}
                  placeholder="10-digit number"
                  size="small"
                />

                <TextField
                  required
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('address')}
                  multiline
                  rows={2}
                  error={getFieldError('address')}
                  helperText={getHelperText('address')}
                  size="small"
                />

                <TextField
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  error={getFieldError('email')}
                  helperText={getHelperText('email')}
                  size="small"
                />

                <TextField
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('username')}
                  error={getFieldError('username')}
                  helperText={getHelperText('username')}
                  size="small"
                />

                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('password')}
                  error={getFieldError('password')}
                  helperText={getHelperText('password')}
                  size="small"
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={isLoading}
                    sx={{ minWidth: '100px' }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Submit'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleReset}
                    disabled={isLoading}
                    sx={{ minWidth: '100px' }}
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right side - Component Names */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom sx={{ 
                mt: { xs: 3, md: 0 },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                Manage Roles
              </Typography>
              <FormGroup sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: 'repeat(2, 1fr)', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                },
                gap: { xs: 0.5, sm: 1 }
              }}>
                {permissionsList.map((component) => (
                  <FormControlLabel
                    key={component}
                    control={
                      <Checkbox
                        checked={componentNames.includes(component)}
                        onChange={() => handleComponentChange(component)}
                        disabled={isLoading}
                        size="small"
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {component}
                      </Typography>
                    }
                    sx={{ 
                      margin: 0, 
                      padding: { xs: '2px 0', sm: '4px 0' },
                      minHeight: { xs: '30px', sm: 'auto' }
                    }}
                  />
                ))}
              </FormGroup>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default EmployeeManagement; 