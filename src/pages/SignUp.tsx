import React from 'react';
import { Box, useTheme } from '@mui/material';
import AppTheme from '../theme/AppTheme';
import SignUpCard from '../components/SignUpCard';

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  const theme = useTheme();
  
  return (
    <AppTheme {...props}>
      {/* <CssBaseline enableColorScheme /> */}
      {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          padding: { xs: 2, sm: 4 },
          position: 'relative',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to bottom right, #1a202c, #2d3748)' 
            : 'linear-gradient(to bottom right, #f7fafc, #ebf4ff)',
          overflow: 'hidden',
          // Keep the existing frame height variable for compatibility
          height: 'calc((1 - var(--template-frame-height, 0)) * 100%)',
          marginTop: 'max(1px - var(--template-frame-height, 0px), 0px)',
          
          // Add some decorative elements for visual interest
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #42a5f5, #1976d2)',
            opacity: 0.1,
            top: '-50px',
            right: '-50px',
            zIndex: 0,
            animation: 'float 8s ease-in-out infinite alternate',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #42a5f5, #1976d2)',
            opacity: 0.1,
            bottom: '-30px',
            left: '-30px',
            zIndex: 0,
            animation: 'float 6s ease-in-out infinite alternate-reverse',
          },
          '@keyframes float': {
            '0%': {
              transform: 'translateY(0) scale(1)',
            },
            '100%': {
              transform: 'translateY(-20px) scale(1.05)',
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '450px',
            margin: '0 auto',
          }}
        >
          <SignUpCard />
        </Box>
      </Box>
    </AppTheme>
  );
}
