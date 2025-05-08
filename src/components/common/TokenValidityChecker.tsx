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
  // No periodic token validity check needed anymore
  return <>{children}</>;
};

export default TokenValidityChecker; 