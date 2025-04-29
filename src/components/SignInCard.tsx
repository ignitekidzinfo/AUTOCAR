import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { SignInUser } from '../Services/userService';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { 
  ArrowBack, 
  Email as EmailIcon, 
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";
import storageUtils from '../utils/storageUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logger from '../utils/logger';
import secureStorage from '../utils/secureStorage';
import { InputAdornment, IconButton, Paper, useTheme, alpha, CircularProgress } from '@mui/material';
import { forceCheckTokenValidity } from '../utils/tokenUtils';

interface MyJwtPayload extends JwtPayload {
  authorities: string[];
  roles: string[];
}

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(5),
  gap: theme.spacing(3),
  boxShadow: theme.shadows[8],
  borderRadius: theme.shape.borderRadius * 2,
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '5px',
    background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
  }
}));

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const Logo = styled('div')(({ theme }) => ({
  width: '60px',
  height: '60px',
  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '24px',
  fontWeight: 'bold',
  boxShadow: theme.shadows[3],
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 1.5,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const BackLink = styled(RouterLink)(({ theme }) => ({
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  transition: 'color 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

export default function SignInCard() {
  const theme = useTheme();
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    forceCheckTokenValidity();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      storageUtils.clearAuthData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
 
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        username: email,
        password
      };
      
      const response = await SignInUser(data);
      
      if (!response) {
        throw new Error("No response received from server");
      }
      
      try {
        const decodedToken = jwtDecode<MyJwtPayload>(response);
        
        const expTime = decodedToken.exp ? Number(decodedToken.exp) * 1000 : 0;
        const currentTime = Date.now();
        
        if (!decodedToken.exp || expTime <= currentTime) {
          toast.error("Session token is expired. Please sign in again.");
          return;
        }

        storageUtils.clearAuthData(); 
        
        secureStorage.setItem("token", response);
        secureStorage.setItem("userData", decodedToken);
        
        const redirectPath = secureStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          secureStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath);
          toast.success("Welcome back! Your session has been restored.");
        } else {
          navigate("/");
          toast.success("Signed in successfully!");
        }
      } catch (decodeError) {
        logger.error("Failed to decode token:", decodeError);
        toast.error("Invalid authentication token received from server");
      }
    } catch (error: any) {
      logger.error("Sign-in failed", error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                             error.response.data?.error || 
                             "Invalid email or password";
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("Server is not responding. Please check if the server is running.");
      } else if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
        
        toast.error("Unable to connect to the server. Please check if the server is running.");
      } else {
        toast.error(error.message || "An unexpected error occurred. Please try again.");
      }
      
      setEmailError(true);
      setPasswordError(true);
      toast.error("Sign-in failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      toast.error('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      toast.error('Password must be at least 6 characters long');
      isValid = false;
    } else {
      setPasswordError(false);
    }

    return isValid;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 2,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom right, #1a202c, #2d3748)' 
          : 'linear-gradient(to bottom right, #f7fafc, #ebf4ff)'
      }}
    >
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <BackLink to="/">
        <ArrowBack sx={{ mr: 1, fontSize: 20 }} /> Back to Home
      </BackLink>
 
    <Card variant="outlined">
        <LogoWrapper>
          <Logo>AC</Logo>
        </LogoWrapper>
        
      <Typography
        component="h1"
        variant="h4"
          sx={{
            width: '100%',
            textAlign: 'center',
            fontWeight: 700,
            marginBottom: 1,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome Back
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 3 }}
      >
          Sign in to your Auto Care account
      </Typography>
        
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
          sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 3 }}
      >
          <FormControl variant="outlined">
            <FormLabel htmlFor="email" sx={{ mb: 1, fontWeight: 500 }}>Email Address</FormLabel>
          <TextField
            error={emailError}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            size="medium"
            color={emailError ? 'error' : 'primary'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5 }
            }}
          />
        </FormControl>
          
          <FormControl variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <FormLabel htmlFor="password" sx={{ fontWeight: 500 }}>Password</FormLabel>
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: 'baseline', color: theme.palette.primary.main }}
            >
              Forgot password?
            </Link>
          </Box>
          <TextField
            error={passwordError}
            name="password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            size="medium"
            color={passwordError ? 'error' : 'primary'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              sx: { borderRadius: 1.5 }
            }}
          />
        </FormControl>
          
          <StyledButton 
            type="submit" 
            fullWidth 
            variant="contained" 
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </StyledButton>
          
          <Typography sx={{ textAlign: 'center', mt: 2 }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/signup"
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              Sign up
            </Link>
        </Typography>
      </Box>
      </Card>
        <ForgotPassword open={open} handleClose={handleClose} />
    </Box>
  );
}
