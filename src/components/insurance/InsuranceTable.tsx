import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Tooltip,
    Chip,
    useTheme,
    alpha,
    useMediaQuery,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { VehicleRegDto } from '../../types/vehicle.types';

interface InsuranceTableProps {
    data: VehicleRegDto[];
    isExpired: boolean;
}

const InsuranceTable: React.FC<InsuranceTableProps> = ({ data, isExpired }) => {
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                marginTop: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <Table sx={{ minWidth: isTablet ? 650 : 800 }}>
                <TableHead sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DirectionsCarIcon fontSize="small" color="primary" />
                                Vehicle Number
                            </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Vehicle Model</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" color="primary" />
                                Customer
                            </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" color="primary" />
                                Mobile
                            </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon fontSize="small" color="primary" />
                                Insured Until
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((item) => {
                        // Calculate if insurance is going to expire soon (within next 30 days)
                        const expiryDate = item.insuredTo ? new Date(item.insuredTo) : null;
                        const today = new Date();
                        const daysUntilExpiry = expiryDate
                            ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                        const expiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

                        return (
                            <TableRow
                                key={item.vehicleRegId}
                                sx={{
                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.03) },
                                    borderLeft: isExpired
                                        ? `4px solid ${theme.palette.error.main}`
                                        : expiringSoon
                                            ? `4px solid ${theme.palette.warning.main}`
                                            : `4px solid ${theme.palette.success.main}`
                                }}
                            >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {item.vehicleNumber}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {item.vehicleModelName || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {item.vehicleBrand || ''}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ maxWidth: isTablet ? '120px' : '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <Tooltip title={item.customerName}>
                                        <Typography variant="body2" noWrap>{item.customerName}</Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body2">{item.customerMobileNumber}</Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {isExpired ? (
                                        <Chip
                                            icon={<WarningAmberIcon />}
                                            label="Expired"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                        />
                                    ) : expiringSoon ? (
                                        <Tooltip title={`Expires in ${daysUntilExpiry} days`}>
                                            <Chip
                                                icon={<AutorenewIcon />}
                                                label={item.insuredTo
                                                    ? new Date(item.insuredTo).toLocaleDateString('en-GB')
                                                    : 'N/A'
                                                }
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        </Tooltip>
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
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default React.memo(InsuranceTable);
