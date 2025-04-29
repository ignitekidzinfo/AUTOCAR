import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import logger from '../../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    logger.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      errorInfo
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          p={3}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              width: '100%', 
              textAlign: 'center' 
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body1" paragraph>
              The application encountered an unexpected error. Our team has been notified.
            </Typography>
            
            <Box my={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => window.location.href = '/'}
                sx={{ ml: 2 }}
              >
                Go to Home
              </Button>
            </Box>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <Box mt={4} textAlign="left">
                <Typography variant="h6" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    maxHeight: 300, 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <strong>{this.state.error.toString()}</strong>
                  
                  {this.state.errorInfo && (
                    <div style={{ marginTop: 12 }}>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    // If there's no error, render the children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 