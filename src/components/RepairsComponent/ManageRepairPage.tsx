import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography
} from '@mui/material';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DescriptionIcon from '@mui/icons-material/Description';
import PolicyIcon from '@mui/icons-material/Policy';

const cardItems = [
  { title: 'Vehicle Registration', icon: <ShoppingCartIcon fontSize="large" sx={{ color: '#ff9800' }} />, link: '/admin/purchase' },
  { title: 'Vehicle ID', icon: <DirectionsCarIcon fontSize="large" sx={{ color: '#2196f3' }} />, link: '/admin/vehicle-registration' },
  { title: 'Vehicle Date Range', icon: <BookOnlineIcon fontSize="large" sx={{ color: '#4caf50' }} />, link: '/admin/booking' },
  { title: 'Vehicle Status', icon: <BuildIcon fontSize="large" sx={{ color: '#f44336' }} />, link: '/admin/service-queue' },
  { title: 'Vehicle Appointment', icon: <HistoryIcon fontSize="large" sx={{ color: '#9c27b0' }} />, link: '/admin/service-history' },
  { title: 'Counter Sale', icon: <PointOfSaleIcon fontSize="large" sx={{ color: '#ff5722' }} />, link: '/admin/counter-sale' },
  { title: 'Quotation', icon: <DescriptionIcon fontSize="large" sx={{ color: '#3f51b5' }} />, link: '/admin/billForm' },
  { title: 'Insurance', icon: <PolicyIcon fontSize="large" sx={{ color: '#00bcd4' }} />, link: '/admin/insurance' },
];

export default function ManageRepairPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        p: 3,
      }}
    >
    
      <Typography variant="h4" align="center" gutterBottom>
        AUTO CAR CARE POINT
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {cardItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ backgroundColor: '#1b1b1b' }}>
              <CardActionArea
                href={item.link} 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  textAlign: 'center',
                  color: '#fff',
                }}
              >
                {item.icon}
                <CardContent>
                  <Typography variant="h6">{item.title}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" align="center">
          Copyright © AutoCarCarePoint 2025.
        </Typography>
      </Box>
    </Box>
  );
}
