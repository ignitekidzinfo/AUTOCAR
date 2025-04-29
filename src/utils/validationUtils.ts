/**
 * Data Validation Utilities
 * 
 * This file provides utilities for validating data before submitting to the backend.
 */

/**
 * Type for validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Base validator interface
 */
interface Validator<T> {
  validate(data: T): ValidationError[];
}

/**
 * User data validator
 */
export class UserValidator implements Validator<any> {
  validate(user: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Email validation
    if (!user.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push({ field: 'email', message: 'Email is invalid' });
    }
    
    // Password validation
    if (!user.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (user.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }
    
    // Name validation
    if (user.name !== undefined && user.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    }
    
    return errors;
  }
}

/**
 * Vehicle data validator
 */
export class VehicleValidator implements Validator<any> {
  validate(vehicle: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // License plate validation
    if (!vehicle.licensePlate) {
      errors.push({ field: 'licensePlate', message: 'License plate is required' });
    }
    
    // Make validation
    if (!vehicle.make) {
      errors.push({ field: 'make', message: 'Make is required' });
    }
    
    // Model validation
    if (!vehicle.model) {
      errors.push({ field: 'model', message: 'Model is required' });
    }
    
    // Year validation
    if (!vehicle.year) {
      errors.push({ field: 'year', message: 'Year is required' });
    } else if (isNaN(Number(vehicle.year)) || Number(vehicle.year) < 1900 || Number(vehicle.year) > new Date().getFullYear() + 1) {
      errors.push({ field: 'year', message: 'Year is invalid' });
    }
    
    return errors;
  }
}

/**
 * Appointment data validator
 */
export class AppointmentValidator implements Validator<any> {
  validate(appointment: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Date validation
    if (!appointment.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    } else {
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      
      if (isNaN(appointmentDate.getTime())) {
        errors.push({ field: 'date', message: 'Date is invalid' });
      } else if (appointmentDate < now) {
        errors.push({ field: 'date', message: 'Date cannot be in the past' });
      }
    }
    
    // Customer validation
    if (!appointment.customerId) {
      errors.push({ field: 'customerId', message: 'Customer is required' });
    }
    
    // Vehicle validation
    if (!appointment.vehicleId) {
      errors.push({ field: 'vehicleId', message: 'Vehicle is required' });
    }
    
    // Service validation
    if (!appointment.serviceType) {
      errors.push({ field: 'serviceType', message: 'Service type is required' });
    }
    
    return errors;
  }
}

/**
 * Generic data validator function
 * @param data - Data to validate
 * @param validatorClass - Validator class to use
 * @returns ValidationError[] - Array of validation errors
 */
export function validateData<T>(data: T, validatorClass: new () => Validator<T>): ValidationError[] {
  const validator = new validatorClass();
  return validator.validate(data);
}

/**
 * Check if data is valid
 * @param data - Data to validate
 * @param validatorClass - Validator class to use
 * @returns boolean - Whether data is valid
 */
export function isValid<T>(data: T, validatorClass: new () => Validator<T>): boolean {
  const errors = validateData(data, validatorClass);
  return errors.length === 0;
}

/**
 * Generic input validation function
 * @param value - Value to validate
 * @param validators - Array of validation functions
 * @returns string | null - Error message or null if valid
 */
export function validateInput(
  value: any,
  validators: Array<(value: any) => string | null>
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Common validation functions
 */
export const validators = {
  required: (value: any) => {
    return value === undefined || value === null || value === '' 
      ? 'This field is required' 
      : null;
  },
  email: (value: string) => {
    return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
      ? 'Invalid email address' 
      : null;
  },
  minLength: (length: number) => (value: string) => {
    return value && value.length < length
      ? `Must be at least ${length} characters`
      : null;
  },
  maxLength: (length: number) => (value: string) => {
    return value && value.length > length
      ? `Must be less than ${length} characters`
      : null;
  },
  numeric: (value: string) => {
    return value && !/^\d+$/.test(value) 
      ? 'Must contain only numbers' 
      : null;
  },
  phone: (value: string) => {
    return value && !/^\+?[\d\s-()]{10,15}$/.test(value)
      ? 'Invalid phone number'
      : null;
  }
}; 