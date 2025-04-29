/**
 * CSRF Protection Utilities
 * 
 * This file provides utilities for CSRF protection. In a production environment,
 * these functions would be implemented on the backend, but they are included here
 * for reference for the backend developer.
 */

// Import crypto library
const crypto = require('crypto');

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify CSRF token
 * @param {string} token - Token from request
 * @param {string} storedToken - Token stored in session
 * @returns {boolean} Whether token is valid
 */
const validateCsrfToken = (token, storedToken) => {
  if (!token || !storedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
};

/**
 * Express middleware for CSRF protection
 * @param {Object} options - Options for CSRF middleware
 * @returns {Function} Express middleware function
 */
const csrfMiddleware = (options = {}) => {
  const excludePaths = options.exclude || [];
  
  return (req, res, next) => {
    // Skip CSRF check for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const token = req.headers['x-csrf-token'];
    
    if (!validateCsrfToken(token, req.session.csrfToken)) {
      return res.status(403).json({
        error: 'Invalid CSRF token'
      });
    }
    
    next();
  };
};

module.exports = {
  generateCsrfToken,
  validateCsrfToken,
  csrfMiddleware
}; 