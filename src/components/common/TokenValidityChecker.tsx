import React, { useEffect } from 'react';
import { forceCheckTokenValidity } from '../../utils/tokenUtils';

interface TokenValidityCheckerProps {
  children: React.ReactNode;
}

/**
 * Component that checks token validity on mount and sets up periodic checks
 * Place this at the top level of authenticated routes/components
 */
const TokenValidityChecker: React.FC<TokenValidityCheckerProps> = ({ children }) => {
  useEffect(() => {
    // Check token validity immediately when component mounts
    forceCheckTokenValidity();
    
    // Set up periodic token validity check every 5 minutes
    // This is mainly just to catch expired tokens, not to force logout on refresh
    const intervalId = setInterval(() => {
      forceCheckTokenValidity();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return <>{children}</>;
};

export default TokenValidityChecker; 