import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, alpha, useTheme, Chip } from '@mui/material';
import { useVirtualizer } from '../../utils/virtualizer';
import { GridRowsProp } from '@mui/x-data-grid';
import { PERFORMANCE_CONSTANTS } from '../../utils/performance';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import PreviewIcon from '@mui/icons-material/Preview';
import { Print, FilterListOutlined } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface VirtualizedVehicleListProps {
  rows: GridRowsProp;
  loading: boolean;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onDetailsClick: (id: string) => void;
  onServiceClick: (id: string) => void;
  onPrintClick?: (id: string) => void;
  isFiltered?: boolean;
}

const VirtualizedVehicleList: React.FC<VirtualizedVehicleListProps> = ({
  rows,
  loading,
  onEditClick,
  onDeleteClick,
  onDetailsClick,
  onServiceClick,
  onPrintClick,
  isFiltered = false
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Virtualization configuration
  const { virtualItems, totalHeight } = useVirtualizer({
    items: rows as any[],
    itemHeight: 120, // Approximate row height
    overscan: 5, // Number of items to render above/below the visible area
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  });

  // Function to render status chip
  const renderStatus = (status: string) => {
    let color;
    let icon;
    
    switch(status.toLowerCase()) {
      case 'complete':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'cancelled':
        color = 'error';
        icon = <CancelIcon fontSize="small" />;
        break;
      case 'waiting':
        color = 'warning';
        icon = <AccessTimeIcon fontSize="small" />;
        break;
      case 'inprogress':
        color = 'info';
        icon = <BuildIcon fontSize="small" />;
        break;
      default:
        color = 'default';
        icon = <AccessTimeIcon fontSize="small" />;
    }
    
    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={color as any}
        size="small"
        icon={icon}
        sx={{ fontWeight: 500 }}
      />
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[2],
      }}
    >
      {loading && rows.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: 300,
          }}
        >
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2 }}>Loading vehicles...</Typography>
        </Box>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: 300,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No vehicles found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isFiltered ? 'Try adjusting your filters' : 'Add a vehicle to get started'}
          </Typography>
        </Box>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            height: '100%',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              height: totalHeight,
              position: 'relative',
              width: '100%',
            }}
          >
            {virtualItems.map(({ item, index, position }) => {
              const row = item as any;
              return (
                <Paper
                  key={row.id}
                  elevation={1}
                  sx={{
                    position: 'absolute',
                    top: position,
                    left: 0,
                    width: '100%',
                    height: 120,
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    backgroundColor: row.isNew 
                      ? alpha(theme.palette.success.light, 0.15)  // Highlight new/modified items
                      : index % 2 === 0 
                        ? alpha(theme.palette.primary.light, 0.03) 
                        : 'background.paper',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      backgroundColor: row.isNew
                        ? alpha(theme.palette.success.light, 0.25)  // Darken on hover
                        : alpha(theme.palette.primary.light, 0.07),
                    },
                    borderLeft: `4px solid ${
                      row.isNew ? theme.palette.success.main :
                      row.status?.toLowerCase() === 'complete' ? theme.palette.success.main :
                      row.status?.toLowerCase() === 'waiting' ? theme.palette.warning.main :
                      row.status?.toLowerCase() === 'inprogress' ? theme.palette.info.main :
                      row.status?.toLowerCase() === 'cancelled' ? theme.palette.error.main :
                      theme.palette.grey[500]
                    }`,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ mr: 1 }}>
                        {row.vehicleNoName}
                      </Typography>
                      {renderStatus(row.status || 'Unknown')}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {row.customerMobile || 'No customer information'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {row.date && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          {new Date(row.date).toLocaleDateString()}
                        </Typography>
                      )}
                      
                      {row.kilometer && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          {row.kilometer} km
                        </Typography>
                      )}
                      
                      {row.advance > 0 && (
                        <Chip
                          label={`₹${row.advance}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      mt: { xs: 1, sm: 0 },
                      gap: 1,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                      onClick={() => onDetailsClick(row.vehicleRegId)}
                    >
                      <PreviewIcon fontSize="small" />
                    </Box>
                    
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: theme.palette.secondary.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        },
                      }}
                      onClick={() => onEditClick(row.vehicleRegId)}
                    >
                      <EditIcon fontSize="small" />
                    </Box>
                    
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                        },
                      }}
                      onClick={() => onDeleteClick(row.vehicleRegId)}
                    >
                      <DeleteIcon fontSize="small" />
                    </Box>
                    
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: theme.palette.info.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                        },
                      }}
                      onClick={() => onServiceClick(row.vehicleRegId)}
                    >
                      <BuildIcon fontSize="small" />
                    </Box>
                    
                    {onPrintClick && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          p: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          color: theme.palette.success.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                          },
                        }}
                        onClick={() => onPrintClick(row.vehicleRegId)}
                      >
                        <Print fontSize="small" />
                      </Box>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
          
          {loading && rows.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              p: 2, 
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              position: 'sticky',
              bottom: 0,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}>
              <CircularProgress size={24} thickness={5} sx={{ mr: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading more vehicles...
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default React.memo(VirtualizedVehicleList); 