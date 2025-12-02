import React from 'react';
import { Button, ButtonProps, CircularProgress, styled } from '@mui/material';

const StyledButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius * 1.5,
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    boxShadow: theme.shadows[4],
    transition: 'all 0.3s ease',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    color: theme.palette.primary.contrastText,
    '&:hover': {
        boxShadow: theme.shadows[8],
        transform: 'translateY(-2px)',
        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    },
    '&:active': {
        transform: 'translateY(0)',
        boxShadow: theme.shadows[2],
    },
    '&.Mui-disabled': {
        background: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
    },
}));

type CustomButtonProps = ButtonProps & {
    isLoading?: boolean;
};

const CustomButton: React.FC<CustomButtonProps> = ({ isLoading, children, disabled, ...props }) => {
    return (
        <StyledButton
            {...props}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <CircularProgress size={24} color="inherit" />
            ) : (
                children
            )}
        </StyledButton>
    );
};

export default CustomButton;
