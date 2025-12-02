import React, { useState } from 'react';
import {
  Box,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Paper,
  useTheme,
  alpha,
  Container,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ArrowBack,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import CustomInput from './common/CustomInput';
import CustomButton from './common/CustomButton';
import ForgotPassword from './ForgotPassword';
import { useLogin } from '../hooks/useLogin';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

export default function SignInCard() {
  const theme = useTheme();
  const { register, handleSubmit, errors, isLoading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme.palette.mode === 'dark'
            ? `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.dark, 0.2)}, ${theme.palette.background.default})`
            : `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.light, 0.1)}, ${theme.palette.background.default})`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.05),
          filter: 'blur(50px)',
          zIndex: 0,
        }}
      />
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: alpha(theme.palette.secondary.main || theme.palette.primary.light, 0.05),
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              mb: 3,
              color: 'text.secondary',
              textDecoration: 'none',
              transition: 'color 0.2s',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <ArrowBack sx={{ mr: 1, fontSize: 20 }} /> Back to Home
          </Link>

          <MotionPaper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            }}
          >
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  AC
                </Typography>
              </Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to continue to Auto Care
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ mb: 3 }}>
                <CustomInput
                  {...register('email')}
                  label="Email Address"
                  placeholder="your@email.com"
                  errorMessage={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Password
                  </Typography>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => setOpenForgotPassword(true)}
                    variant="body2"
                    underline="hover"
                    sx={{ fontWeight: 500 }}
                  >
                    Forgot password?
                  </Link>
                </Box>
                <CustomInput
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  errorMessage={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <CustomButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                isLoading={isLoading}
              >
                Sign In
              </CustomButton>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/signup"
                    sx={{ fontWeight: 600, textDecoration: 'none' }}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </MotionPaper>
        </MotionBox>
      </Container>

      <ForgotPassword
        open={openForgotPassword}
        handleClose={() => setOpenForgotPassword(false)}
      />
    </Box>
  );
}
