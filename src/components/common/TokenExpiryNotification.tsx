import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const TokenExpiryNotification: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleTokenExpiry = (event: CustomEvent) => {
      setMessage(event.detail.message);
      setOpen(true);
    };

    document.addEventListener('token-expired', handleTokenExpiry as EventListener);

    return () => {
      document.removeEventListener('token-expired', handleTokenExpiry as EventListener);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default TokenExpiryNotification; 