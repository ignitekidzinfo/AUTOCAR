import React, { useState, useEffect, useRef } from 'react';
import { Snackbar, Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress } from '@mui/material';
import { getTimeUntilExpiration, logout } from '../../utils/tokenUtils';
import { apiClient } from '../../utils/apiClient';
import secureStorage from '../../utils/secureStorage';
import logger from '../../utils/logger';
import { toast } from 'react-toastify';

interface SessionExpirationHandlerProps {
  // Time in milliseconds before expiration to show warning (default: 5 minutes)
  warningTime?: number;
  // Time in milliseconds before expiration to show critical warning (default: 1 minute)
  criticalTime?: number;
}

const SessionExpirationHandler: React.FC<SessionExpirationHandlerProps> = ({
  warningTime = 5 * 60 * 1000,
  criticalTime = 60 * 1000,
}) => {
  const [warningOpen, setWarningOpen] = useState(false);
  const [criticalOpen, setCriticalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [savingWork, setSavingWork] = useState(false);
  
  // Keep track of timers with refs to properly clean them up
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const criticalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clean up all timers
  const clearAllTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  };

  // Function to acknowledge warning and continue the session
  // (but not actually refresh the token since backend doesn't support it)
  const acknowledgeWarning = () => {
    setSavingWork(true);
    
    try {
      // Just dismiss warnings
      setWarningOpen(false);
      setCriticalOpen(false);
      
      // Inform user of session limitations
      toast.info("Your session will still expire as scheduled. Please save your work and consider logging in again soon.", {
        autoClose: 5000
      });
      
      // Reset inactivity timer
      resetInactivityTimer();
    } finally {
      setSavingWork(false);
    }
  };

  // Perform secure logout
  const performSecureLogout = async () => {
    try {
      // Clear all timers
      clearAllTimers();
      
      // Optional: Store current path to redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/signIn') {
        secureStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Attempt to notify server about logout to invalidate session if possible
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        // Ignore errors from logout endpoint, as it may not exist
        logger.warn('Could not notify server about logout:', error);
      }
    } catch (error) {
      logger.error('Error during secure logout:', error);
    } finally {
      // Always perform client-side logout
      logout();
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer (2 hours of inactivity - increased from 30 minutes)
    inactivityTimerRef.current = setTimeout(() => {
      logger.warn('User inactive for too long, logging out');
      performSecureLogout();
    }, 2 * 60 * 60 * 1000); // 2 hours
  };

  // Check token expiration and set up timers
  const checkExpiration = () => {
    const expTime = getTimeUntilExpiration();
    
    // Skip the check entirely if we can't determine the expiration time
    // This prevents problems during initial login when the token might not be fully stored yet
    if (expTime === null) {
      return;
    }
    
    // Only perform immediate logout if token is actually significantly expired
    // (more than 1 minute past expiration)
    if (expTime <= -60000) {
      performSecureLogout();
      return;
    }
    
    setTimeLeft(expTime);
  
    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (criticalTimerRef.current) clearTimeout(criticalTimerRef.current);
    
    // Set up warning timer
    if (expTime > warningTime) {
      warningTimerRef.current = setTimeout(() => {
        setWarningOpen(true);
      }, expTime - warningTime);
      
      // Set up critical warning timer
      criticalTimerRef.current = setTimeout(() => {
        setWarningOpen(false);
        setCriticalOpen(true);
      }, expTime - criticalTime);
    } else if (expTime > criticalTime) {
      // Already past warning time but not critical
      setWarningOpen(true);
      
      // Set up critical warning timer
      criticalTimerRef.current = setTimeout(() => {
        setWarningOpen(false);
        setCriticalOpen(true);
      }, expTime - criticalTime);
    } else if (expTime > 0) {
      // Only show critical warning if there's still time left
      setCriticalOpen(true);
    }
  };
    
  // Set up event listeners and timers
  useEffect(() => {
    // Delay the initial check by 2 seconds to avoid race conditions during login
    const initialCheckTimer = setTimeout(() => {
      checkExpiration();
    }, 2000);
    
    // Set up interval to check every 10 minutes instead of every 5 minutes
    // This reduces the frequency of checks that could cause logout issues
    intervalRef.current = setInterval(checkExpiration, 10 * 60 * 1000);
    
    // Set up user activity listeners
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Function to handle user activity
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Initial inactivity timer
    resetInactivityTimer();
    
    // Cleanup function
    return () => {
      clearTimeout(initialCheckTimer);
      clearAllTimers();
      
      // Remove event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [warningTime, criticalTime]);

  // Calculate remaining time for display
  const getFormattedTimeLeft = (): string => {
    if (!timeLeft) return '0:00';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Warning notification */}
      <Snackbar
        open={warningOpen}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="warning"
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={acknowledgeWarning}
              disabled={savingWork}
            >
              {savingWork ? <CircularProgress size={20} /> : 'Continue Session'}
            </Button>
          }
        >
          Your session will expire in {getFormattedTimeLeft()}. Please save your work.
        </Alert>
      </Snackbar>

      {/* Critical dialog - can't be dismissed except by action */}
      <Dialog
        open={criticalOpen}
        disableEscapeKeyDown
      >
        <DialogTitle>
          Session Expiring
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your session will expire in {getFormattedTimeLeft()}. Any unsaved work will be lost.
            Please save your work now.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={performSecureLogout} color="error">
            Log Out Now
          </Button>
          <Button 
            onClick={acknowledgeWarning} 
            variant="contained" 
            color="primary" 
            autoFocus
            disabled={savingWork}
          >
            {savingWork ? <CircularProgress size={20} /> : 'I Need More Time'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionExpirationHandler; 