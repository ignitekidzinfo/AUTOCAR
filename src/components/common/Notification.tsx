import React, { forwardRef, useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Grow
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close as CloseIcon, CheckCircle, Error as ErrorIcon, Warning, Info } from '@mui/icons-material';

// Types for our notification system
type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationPosition = 'top' | 'bottom';
type NotificationHorizontal = 'left' | 'center' | 'right';

interface NotificationOptions {
  message: string;
  type?: NotificationType;
  duration?: number;
  position?: NotificationPosition;
  horizontal?: NotificationHorizontal;
}

interface AlertDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: NotificationType;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  showAlertDialog: (options: AlertDialogOptions) => Promise<boolean>;
  clearNotifications: () => void;
}

// Default empty implementation
const defaultNotificationContext: NotificationContextType = {
  showNotification: () => {},
  showAlertDialog: () => Promise.resolve(false),
  clearNotifications: () => {}
};

// Create notification context
const NotificationContext = createContext<NotificationContextType>(defaultNotificationContext);

// Custom Grow transition for Snackbar
const GrowTransition = forwardRef(function GrowTransition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Grow ref={ref} {...props} />;
});

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [alertDialog, setAlertDialog] = useState<AlertDialogOptions | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResolver, setDialogResolver] = useState<((value: boolean) => void) | null>(null);

  useEffect(() => {
    if (notification) {
      setOpen(true);
    }
  }, [notification]);

  const showNotification = (options: NotificationOptions) => {
    setNotification(options);
  };

  const showAlertDialog = (options: AlertDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertDialog(options);
      setDialogOpen(true);
      setDialogResolver(() => resolve);
    });
  };

  const clearNotifications = () => {
    setOpen(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  const handleDialogClose = (confirmed: boolean) => {
    setDialogOpen(false);
    if (dialogResolver) {
      dialogResolver(confirmed);
      setDialogResolver(null);
    }
    setTimeout(() => {
      setAlertDialog(null);
    }, 300);
  };

  // Icon based on alert type
  const getAlertIcon = (type?: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <Info />;
    }
  };

  // Get button color based on type
  const getButtonColor = (type?: NotificationType) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'primary';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showAlertDialog, clearNotifications }}>
      {children}

      {/* Snackbar for toast notifications */}
      {notification && (
        <Snackbar
          open={open}
          autoHideDuration={notification.duration || 5000}
          onClose={handleClose}
          TransitionComponent={GrowTransition}
          anchorOrigin={{ 
            vertical: notification.position || 'top', 
            horizontal: notification.horizontal || 'center' 
          }}
        >
          <Alert
            severity={notification.type || 'info'}
            sx={{ 
              width: '100%', 
              alignItems: 'center',
              borderRadius: 2,
              boxShadow: 3
            }}
            onClose={handleClose}
            icon={getAlertIcon(notification.type)}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}

      {/* Alert Dialog component for confirmations */}
      {alertDialog && (
        <Dialog
          open={dialogOpen}
          onClose={() => handleDialogClose(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3,
              maxWidth: '450px',
              width: '100%'
            }
          }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center">
              {getAlertIcon(alertDialog.type)}
              <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                {alertDialog.title || (
                  alertDialog.type === 'error' ? 'Error' :
                  alertDialog.type === 'warning' ? 'Warning' :
                  alertDialog.type === 'success' ? 'Success' : 'Confirmation'
                )}
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => handleDialogClose(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertDialog.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => handleDialogClose(false)} 
              variant="outlined"
              color="inherit"
            >
              {alertDialog.cancelLabel || 'Cancel'}
            </Button>
            <Button 
              onClick={() => handleDialogClose(true)} 
              variant="contained"
              color={getButtonColor(alertDialog.type)}
              autoFocus
            >
              {alertDialog.confirmLabel || 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification system
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  // Return default context if not within provider (instead of throwing error)
  if (context === undefined) {
    console.error('useNotification must be used within a NotificationProvider');
    return defaultNotificationContext;
  }
  return context;
}; 
 