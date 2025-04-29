/**
 * Permission and Authorization Utilities
 * 
 * This file provides utilities for more robust role-based permissions
 * and authorization checks throughout the application.
 */
import { getUserFromToken } from './tokenUtils';

// Define permission types
export type Permission = 
  | 'manage_repairs' 
  | 'manage_users' 
  | 'service_queue' 
  | 'bookings' 
  | 'counter_sale' 
  | 'manage_stock'
  | 'terms_conditions'
  | 'view_reports'
  | 'manage_employees'
  | 'admin_access';

// Define role types
export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | 'USER';

// Define role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'manage_repairs',
    'manage_users',
    'service_queue',
    'bookings',
    'counter_sale',
    'manage_stock',
    'terms_conditions',
    'view_reports',
    'manage_employees',
    'admin_access'
  ],
  EMPLOYEE: [
    'manage_repairs',
    'service_queue',
    'bookings',
    'counter_sale',
    'manage_stock'
  ],
  CUSTOMER: [
    'bookings'
  ],
  USER: []
};

// Map component names from JWT to permissions
const componentToPermission: Record<string, Permission> = {
  'Manage Repairs': 'manage_repairs',
  'Manage User': 'manage_users',
  'Service Queue': 'service_queue',
  'Bookings': 'bookings',
  'Counter Sale': 'counter_sale',
  'Manage Stock': 'manage_stock',
  'Terms & Conditions': 'terms_conditions',
  'Reports': 'view_reports',
  'Manage Employees': 'manage_employees'
};

/**
 * Check if current user has permission
 * @param {Permission | Permission[]} requiredPermissions - Permission(s) to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (requiredPermissions: Permission | Permission[]): boolean => {
  const user = getUserFromToken();
  
  // Not authenticated
  if (!user.isAuthenticated) {
    return false;
  }
  
  // Convert single permission to array
  const permissionsToCheck = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  // Admin has all permissions
  if (user.role === 'ADMIN') {
    return true;
  }
  
  // Convert role to permissions
  const roleBasedPermissions = rolePermissions[user.role as Role] || [];
  
  // Convert component names to permissions
  const componentPermissions = user.components
    .map(comp => componentToPermission[comp])
    .filter(Boolean) as Permission[];
  
  // Combine all user permissions
  const userPermissions = [...new Set([...roleBasedPermissions, ...componentPermissions])];
  
  // Check if user has all required permissions
  return permissionsToCheck.every(perm => userPermissions.includes(perm));
};

/**
 * Check if current user has all required roles
 * @param {Role | Role[]} requiredRoles - Roles to check
 * @returns {boolean} - Whether user has all required roles
 */
export const hasRole = (requiredRoles: Role | Role[]): boolean => {
  const user = getUserFromToken();
  
  // Not authenticated
  if (!user.isAuthenticated) {
    return false;
  }
  
  // Convert single role to array
  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return rolesToCheck.includes(user.role as Role);
};

/**
 * Get all permissions for current user
 * @returns {Permission[]} - Array of permissions
 */
export const getUserPermissions = (): Permission[] => {
  const user = getUserFromToken();
  
  if (!user.isAuthenticated) {
    return [];
  }
  
  // Get role-based permissions
  const roleBasedPermissions = rolePermissions[user.role as Role] || [];
  
  // Get component-based permissions
  const componentPermissions = user.components
    .map(comp => componentToPermission[comp])
    .filter(Boolean) as Permission[];
  
  // Combine and deduplicate
  return [...new Set([...roleBasedPermissions, ...componentPermissions])];
}; 