import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { SendOTP, signUpUser } from '../Services/userService';
import OTPComponent from './OTPComponent';
import { 
  ArrowBack, 
  Email as EmailIcon, 
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  InfoOutlined
} from "@mui/icons-material";
import { InputAdornment, IconButton, CircularProgress } from '@mui/material';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(5),
  gap: theme.spacing(3),
  margin: 'auto',
  boxShadow: theme.shadows[8],
  borderRadius: theme.shape.borderRadius * 2,
  [theme.breakpoints.up('sm')]: {
    width: '500px',
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

export default function SignUpCard() {
  const theme = useTheme();
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [nameError, setNameError] = useState(false);
  const [lNameError, setLNameError] = useState(false);
  const [mobileNoError, setMobileNoError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [lNameErrorMessage, setLNameErrorMessage] = useState('');
  const [mobileNoErrorMessage, setMobileNoErrorMessage] = useState('');
  const [addressErrorMessage, setAddressErrorMessage] = useState('');
  const [otpOpen, setOtpClosed] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [isVerify, setIsVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateInputs = () => {
    let isValid = true;

    if (!isVerify) {
      setEmailError(true);
      setEmailErrorMessage('Email verification is required before registration');
      isValid = false;
    } else if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!fname || fname.length < 1) {
      setNameError(true);
      setNameErrorMessage('First Name is required');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!lname || lname.length < 1) {
        setLNameError(true);
      setLNameErrorMessage('Last Name is required');
        isValid = false;
      } else {
        setLNameError(false);
        setLNameErrorMessage('');
      }

    if (!mobileNo || !/^\d{10}$/.test(mobileNo)) {
        setMobileNoError(true);
      setMobileNoErrorMessage('Please enter a valid 10-digit mobile number');
        isValid = false;
      } else {
        setMobileNoError(false);
        setMobileNoErrorMessage('');
      }

    if (!address || address.length < 1) {
        setAddressError(true);
      setAddressErrorMessage('Address is required');
        isValid = false;
      } else {
        setAddressError(false);
        setAddressErrorMessage('');
      }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
  
    if (!validateInputs()) {
      return; 
    }

    setIsLoading(true);
  
    try {
      const formData = {
        fname: fname,
        lname: lname,
        email: email,
        password: password,
        mobileNumber: mobileNo,
        address: address,
        role: 'USER'
      };
      
      const response = await signUpUser(formData);
      if (response.code == 200) {
        console.log("User signed up successfully:", response);
        alert("Sign-up successful!");
        navigate("/signIn");
      } else {
        alert("Something is wrong");
      }
    } catch (err) {
      console.error("Error signing up:", err);
      alert("Sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendOtpToVerfyMail = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = {
        email: email
      };
      
      const response = await SendOTP(data);
      if (response.errorCode == "NOT_FOUND") {
        alert(response.errorMessage);
      } else {
        console.log("send OTP successfully", response);
        alert("Send OTP successfully");
      }
      setOtpClosed(true);
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
  }
  };

  const handleOpen = () => {
    setOtpClosed(true);
  };

  const handleClose = () => {
    setOtpClosed(false);
  };
  
  const handleVerifiedEmail = () => {
    setIsVerify(true);
  };

  const handleVerifySuccess = () => {
    setIsVerify(true); 
    setOtpClosed(false); 
  };

  return (
    <Card>
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
        Create Account
      </Typography>
      
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: 'center', mb: 3 }}
      >
        Join Auto Care today
      </Typography>
      
      <Typography
        variant="body2"
        color="primary"
        sx={{ 
          textAlign: 'center', 
          mb: 2, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          padding: 1,
          borderRadius: 1
        }}
          >
        <InfoOutlined fontSize="small" />
        Email verification is required to create an account
          </Typography>
      
          <Box
            component="form"
            onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" sx={{ flex: 1 }}>
            <FormLabel htmlFor="fname" sx={{ mb: 1, fontWeight: 500 }}>First Name</FormLabel>
              <TextField
                error={nameError}
                helperText={nameErrorMessage}
              id="name"
              name="fname"
              placeholder="John"
              autoComplete="given-name"
              size="medium"
              fullWidth
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1.5 }
              }}
              />
            </FormControl>
          
          <FormControl variant="outlined" sx={{ flex: 1 }}>
            <FormLabel htmlFor="lname" sx={{ mb: 1, fontWeight: 500 }}>Last Name</FormLabel>
              <TextField
                error={lNameError}
                helperText={lNameErrorMessage}
              id="lname"
              name="lname"
              placeholder="Doe"
              autoComplete="family-name"
              size="medium"
              fullWidth
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1.5 }
              }}
              />
            </FormControl>
        </Box>

        <FormControl variant="outlined">
          <FormLabel htmlFor="email" sx={{ mb: 1, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            Email Address
            {isVerify && (
              <CheckCircleIcon sx={{ ml: 1, color: 'success.main', fontSize: 18 }} />
            )}
          </FormLabel>
          <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
                required
                fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isVerify}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1.5 }
              }}
            />
            {!isVerify && (
              <Button
                variant="outlined"
                onClick={handleSendOtpToVerfyMail}
                disabled={isLoading}
                sx={{ 
                  whiteSpace: 'nowrap',
                  borderRadius: 1.5,
                  minWidth: '120px'
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : otpOpen ? 'OTP Sent' : 'Verify Email'}
              </Button>
            )}
          </Box>
        </FormControl>

        <FormControl variant="outlined">
          <FormLabel htmlFor="mobileNo" sx={{ mb: 1, fontWeight: 500 }}>Mobile Number</FormLabel>
              <TextField
            error={mobileNoError}
            helperText={mobileNoErrorMessage}
            id="mobileNo"
            name="mobileNo"
            placeholder="1234567890"
            autoComplete="tel"
                required
                fullWidth
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5 }
            }}
          />
        </FormControl>

        <FormControl variant="outlined">
          <FormLabel htmlFor="password" sx={{ mb: 1, fontWeight: 500 }}>Password</FormLabel>
          <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            fullWidth
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

        <FormControl variant="outlined">
          <FormLabel htmlFor="address" sx={{ mb: 1, fontWeight: 500 }}>Address</FormLabel>
              <TextField
            error={addressError}
            helperText={addressErrorMessage}
            id="address"
                name="address"
            placeholder="Your address"
            autoComplete="street-address"
                required
                fullWidth
            multiline
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1 }}>
                  <HomeIcon color="action" />
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
          disabled={isLoading || !isVerify}
          sx={{ mt: 3 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </StyledButton>

            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/signIn"
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
      <OTPComponent 
        open={otpOpen} 
        email={email}
        handleClose={handleClose}
        isVerifySuccess={handleVerifySuccess}
      />
        </Card>
  );
}
