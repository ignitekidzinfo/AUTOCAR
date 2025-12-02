import React from 'react';
import {
    Paper,
    Grid,
    Box,
    Typography,
    Chip,
    Divider,
    useTheme,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { VehicleRegDto } from '../../types/vehicle.types';

interface InsuranceCardProps {
    item: VehicleRegDto;
    isExpired: boolean;
}

const InsuranceCard: React.FC<InsuranceCardProps> = ({ item, isExpired }) => {
    const theme = useTheme();

    // Calculate if insurance is going to expire soon (within next 30 days)
    const expiryDate = item.insuredTo ? new Date(item.insuredTo) : null;
    const today = new Date();
    const daysUntilExpiry = expiryDate
        ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const expiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: isExpired
                    ? `4px solid ${theme.palette.error.main}`
                    : expiringSoon
                        ? `4px solid ${theme.palette.warning.main}`
                        : `4px solid ${theme.palette.success.main}`
            }}
        >
            <Grid container spacing={1}>
                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <DirectionsCarIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                        {item.vehicleNumber}
                    </Typography>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <EventIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Insurance</Typography>
                    </Box>
                    {isExpired ? (
                        <Chip
                            icon={<WarningAmberIcon />}
                            label="Expired"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    ) : expiringSoon ? (
                        <Chip
                            icon={<AutorenewIcon />}
                            label={item.insuredTo
                                ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                                : 'N/A'
                            }
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    ) : (
                        <Chip
                            icon={<VerifiedUserIcon />}
                            label={item.insuredTo
                                ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                                : 'N/A'
                            }
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    )}
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <PersonIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Customer</Typography>
                    </Box>
                    <Typography variant="body2">{item.customerName}</Typography>
                </Grid>

                <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <PhoneIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">Contact</Typography>
                    </Box>
                    <Typography variant="body2">{item.customerMobileNumber}</Typography>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Vehicle Model</Typography>
                        <Typography variant="body2">
                            {item.vehicleModelName || 'N/A'} {item.vehicleBrand ? `(${item.vehicleBrand})` : ''}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default React.memo(InsuranceCard);
