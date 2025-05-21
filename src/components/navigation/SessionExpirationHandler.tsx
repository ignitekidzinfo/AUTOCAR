import React, { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, Box } from '@mui/material';
import { getTimeUntilExpiration, refreshTokenIfNeeded } from '../../utils/tokenUtils';
import { Link } from 'react-router-dom';

interface SessionExpirationHandlerProps {
  // Time in milliseconds before expiration to show warning (default: 5 minutes)
  warningTime?: number;
  // Time in milliseconds before expiration to show critical warning (default: 1 minute)
  criticalTime?: number;
}

/**
 * Monitors token expiration and displays warnings to the user
 * Does NOT automatically log the user out
 */
const SessionExpirationHandler: React.FC<SessionExpirationHandlerProps> = ({
  warningTime = 5 * 60 * 1000, // 5 minutes
  criticalTime = 60 * 1000, // 1 minute
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check session status periodically
  useEffect(() => {
    const checkSessionStatus = () => {
      const timeUntilExpiration = getTimeUntilExpiration();
      
      if (timeUntilExpiration === null) {
        // Token is invalid or not present
        clearInterval(checkIntervalRef.current!);
        return;
      }
      
      setTimeRemaining(timeUntilExpiration);
      
      if (timeUntilExpiration <= criticalTime) {
        setShowCritical(true);
        setShowWarning(false);
      } else if (timeUntilExpiration <= warningTime) {
        setShowWarning(true);
      }
    };
    
    // Initial check
    checkSessionStatus();
    
    // Set up interval (check every 30 seconds)
    checkIntervalRef.current = setInterval(checkSessionStatus, 30000);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [warningTime, criticalTime]);
  
  // Handle manual token refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTokenIfNeeded(true); // Force refresh
      
      // Check if refresh was successful
      const newTimeUntilExpiration = getTimeUntilExpiration();
      if (newTimeUntilExpiration && newTimeUntilExpiration > warningTime) {
        setShowWarning(false);
        setShowCritical(false);
      }
    } catch (error) {
      console.error('Failed to refresh token', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format the time remaining into a readable string
  const formatTimeRemaining = (ms: number | null): string => {
    if (ms === null) return 'Unknown';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };
  
  // Close warning notification
  const handleCloseWarning = () => {
    setShowWarning(false);
  };
  
  return (
    <>
      {/* Regular warning notification */}
      <Snackbar
        open={showWarning && !showCritical}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={30000} // Auto-hide after 30 seconds
        onClose={handleCloseWarning}
      >
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              startIcon={isRefreshing ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
            </Button>
          }
        >
          Your session will expire in {formatTimeRemaining(timeRemaining)}
        </Alert>
      </Snackbar>
      
      {/* Critical warning dialog */}
      <Dialog
        open={showCritical}
        aria-labelledby="session-expiration-dialog-title"
      >
        <DialogTitle id="session-expiration-dialog-title">
          Session Expiring Soon
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your session will expire in {formatTimeRemaining(timeRemaining)}. Would you like to extend your session?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            component={Link} 
            to="/signIn" 
            color="primary"
          >
            Sign in again
          </Button>
          <Button 
            onClick={handleRefresh} 
            color="primary" 
            variant="contained"
            disabled={isRefreshing}
            startIcon={isRefreshing ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isRefreshing ? 'Refreshing...' : 'Extend Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionExpirationHandler; 