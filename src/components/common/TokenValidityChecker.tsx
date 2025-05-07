import React, { useEffect, useRef } from 'react';
import { forceCheckTokenValidity } from '../../utils/tokenUtils';
import { getAuthToken } from '../../utils/storageUtils';

interface TokenValidityCheckerProps {
  children: React.ReactNode;
}

/**
 * Component that checks token validity periodically but not on mount
 * This avoids token validation issues when navigating between components
 */
const TokenValidityChecker: React.FC<TokenValidityCheckerProps> = ({ children }) => {
  // Use ref to track if component is mounted
  const isMounted = useRef(false);

  useEffect(() => {
    // Skip initial token check on first mount
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    
    // Ensure the token exists before setting up checks
    const hasToken = !!getAuthToken();
    
    if (!hasToken) {
      return;
    }
    
    // Set up periodic token validity check every 15 minutes
    // This is mainly just to catch expired tokens, not to force logout on refresh
    const intervalId = setInterval(() => {
      forceCheckTokenValidity();
    }, 15 * 60 * 1000); // 15 minutes
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return <>{children}</>;
};

export default TokenValidityChecker; 