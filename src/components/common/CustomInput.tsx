import React, { forwardRef } from 'react';
import { TextField, TextFieldProps, styled, alpha } from '@mui/material';

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        transition: 'all 0.3s ease',
        borderRadius: theme.shape.borderRadius * 1.5,
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.02),
        '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.05),
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
            },
        },
        '&.Mui-focused': {
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.white, 1),
            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`,
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
            },
        },
        '&.Mui-error': {
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
            },
            '&.Mui-focused': {
                boxShadow: `0 0 0 4px ${alpha(theme.palette.error.main, 0.2)}`,
            },
        },
    },
    '& .MuiInputLabel-root': {
        '&.Mui-focused': {
            color: theme.palette.primary.main,
            fontWeight: 600,
        },
        '&.Mui-error': {
            color: theme.palette.error.main,
        },
    },
}));

type CustomInputProps = TextFieldProps & {
    errorMessage?: string;
};

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
    ({ errorMessage, ...props }, ref) => {
        return (
            <StyledTextField
                {...props}
                inputRef={ref}
                error={!!errorMessage}
                helperText={errorMessage}
                fullWidth
                variant="outlined"
            />
        );
    }
);

CustomInput.displayName = 'CustomInput';

export default CustomInput;
