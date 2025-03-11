
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


const cardItems = [
  { title: 'Add New Stock', icon: <ShoppingCartIcon fontSize="large" />, link: '/admin/transaction' },
  { title: 'View All Stock', icon: <DirectionsCarIcon fontSize="large" />, link: '/admin/transaction-list' },
  { title: 'View by Partname', icon: <BookOnlineIcon fontSize="large" />, link: '/admin/booking' },
  { title: 'Manage Stock', icon: <BuildIcon fontSize="large" />, link: '/admin/service-queue' },
  { title: 'Stock By Date', icon: <HistoryIcon fontSize="large" />, link: '/admin/service-history' },
  { title: 'Counter Sale', icon: <PointOfSaleIcon fontSize="large" />, link: '/admin/counter-sale' }
];


export default function StockManageGrid() {
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
          Copyright © Sitemark 2025.
        </Typography>
      </Box>
    </Box>
  );
}
