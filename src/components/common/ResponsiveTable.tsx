import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';

// Type definitions
export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: number | string;
  stickyHeader?: boolean;
  containerStyle?: React.CSSProperties;
  onRowClick?: (row: any) => void;
}

/**
 * A responsive table component that adapts to different screen sizes
 * On mobile, it switches to a card layout for better readability
 */
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  title,
  loading = false,
  emptyMessage = "No data to display",
  maxHeight = 440,
  stickyHeader = true,
  containerStyle,
  onRowClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle empty data state
  if (!loading && (!data || data.length === 0)) {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            {title}
          </Typography>
        )}
        <Paper sx={{ width: '100%', p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            {title}
          </Typography>
        )}
        <Paper sx={{ width: '100%', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={30} thickness={4} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading data...
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            {title}
          </Typography>
        )}
        <Grid container spacing={2}>
          {data.map((row, rowIndex) => (
            <Grid item xs={12} key={`row-${rowIndex}`}>
              <Card 
                sx={{ 
                  width: '100%', 
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': onRowClick ? { 
                    boxShadow: 3,
                    transition: 'box-shadow 0.2s' 
                  } : {}
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                <CardContent sx={{ p: 2 }}>
                  {columns
                    .filter(column => !column.hideOnMobile)
                    .map((column, colIndex) => (
                      <Box key={`${column.id}-${colIndex}`} sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          {column.label}
                        </Typography>
                        <Typography variant="body2">
                          {column.format ? column.format(row[column.id]) : row[column.id]}
                        </Typography>
                        {colIndex < columns.length - 1 && <Divider sx={{ mt: 1 }} />}
                      </Box>
                    ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Desktop table view
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
          {title}
        </Typography>
      )}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight, ...containerStyle }}>
          <Table stickyHeader={stickyHeader} size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.background.paper }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth || 'auto' }}
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: (theme) => theme.palette.background.paper
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => {
                return (
                  <TableRow 
                    hover 
                    tabIndex={-1} 
                    key={`row-${rowIndex}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:nth-of-type(odd)': {
                        backgroundColor: (theme) => theme.palette.action.hover,
                      }
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ResponsiveTable; 
 