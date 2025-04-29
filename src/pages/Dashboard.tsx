import React, { useEffect, useState, useCallback } from "react";
import { keyframes } from "@emotion/react";
import { useTheme, alpha } from "@mui/material/styles";
import { 
  Box, 
  Card, 
  CardActionArea, 
  Typography, 
  Container, 
  Paper, 
  Divider, 
  Grid, 
  Avatar,
  useMediaQuery,
  Chip,
  Badge,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GarageIcon from '@mui/icons-material/Garage';
import BuildIcon from '@mui/icons-material/Build';
import StoreIcon from '@mui/icons-material/Store';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import TimeToLeaveIcon from '@mui/icons-material/TimeToLeave';
import TireRepairIcon from '@mui/icons-material/TireRepair';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import ConstructionIcon from '@mui/icons-material/Construction';
import HandymanIcon from '@mui/icons-material/Handyman';
import EngineeringIcon from '@mui/icons-material/Engineering';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { jwtDecode } from "jwt-decode";
import storageUtils from '../utils/storageUtils';

// Primary dashboard items - these are unique to the dashboard
const allComponents = [
  {
    value: "Purchase",
    icon: <AddShoppingCartIcon sx={{ color: "primary.main", fontSize: 40 }} />,
    url: "/admin/transaction",
    description: "Manage purchases and transactions",
    badge: 3
  },
  {
    value: "Service Queue",
    icon: <ArticleIcon sx={{ color: "secondary.main", fontSize: 40 }} />,
    url: "/admin/vehicle?listType=serviceQueue",
    description: "View and manage pending services",
    badge: 5,
    urgent: true
  },
  {
    value: "Bookings",
    icon: <GarageIcon sx={{ color: "success.main", fontSize: 40 }} />,
    url: "/admin/appointmentList",
    description: "Track all service appointments",
    badge: 2
  },
  {
    value: "Vehicle Registration",
    icon: <GarageIcon sx={{ color: "info.main", fontSize: 40 }} />,
    url: "/admin/vehicle/add",
    description: "Register new vehicles",
  },
  {
    value: "Service History",
    icon: <FormatListBulletedIcon sx={{ color: "warning.main", fontSize: 40 }} />,
    url: "/admin/vehicle?listType=serviceHistory",
    description: "View completed service records",
  },
  {
    value: "Counter Sale",
    icon: <StoreIcon sx={{ color: "error.main", fontSize: 40 }} />,
    url: "/admin/counterSale",
    description: "Process direct sales transactions",
    badge: 1
  },
  {
    value: "Quotation",
    icon: <DescriptionIcon sx={{ color: "primary.dark", fontSize: 40 }} />,
    url: "/admin/quatationlist",
    description: "Create and manage quotations",
  },
  {
    value: "Insurance",
    icon: <SecurityIcon sx={{ color: "secondary.dark", fontSize: 40 }} />,
    url: "/admin/insuranceList",
    description: "Handle insurance claims and policies",
  },
];

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.5);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(66, 153, 225, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0);
  }
`;

// Add a new glow keyframe animation
const glow = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(66, 153, 225, 0.5), 0 0 20px rgba(66, 153, 225, 0);
  }
  50% {
    box-shadow: 0 0 15px rgba(66, 153, 225, 0.7), 0 0 30px rgba(66, 153, 225, 0.4);
  }
  100% {
    box-shadow: 0 0 10px rgba(66, 153, 225, 0.5), 0 0 20px rgba(66, 153, 225, 0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-12px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

// Get color for card based on index
const getCardGlowColor = (index: number) => {
  const colors = [
    'rgba(99, 102, 241, 0.8)', // indigo
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(59, 130, 246, 0.8)', // blue
    'rgba(16, 185, 129, 0.8)', // green
    'rgba(245, 158, 11, 0.8)', // amber
    'rgba(239, 68, 68, 0.8)',  // red
    'rgba(139, 92, 246, 0.8)', // purple
    'rgba(14, 165, 233, 0.8)'  // sky
  ];
  return colors[index % colors.length];
};

// Define colors for card borders
const getCardBorderGlow = (index: number, isDark: boolean) => {
  const color = getCardGlowColor(index);
  return isDark 
    ? `0 0 15px ${color}, inset 0 0 10px ${color.replace('0.8', '0.3')}`
    : `0 0 15px ${color.replace('0.8', '0.5')}, inset 0 0 5px ${color.replace('0.8', '0.2')}`;
};

// Add these new animations after the existing ones
const slideIn = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
`;

const glitter = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Add these new animations after the existing ones
const driveIn = keyframes`
  0% {
    transform: translateX(-100%) rotate(0deg);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translateX(100vw) rotate(0deg);
    opacity: 0;
  }
`;

const speedometer = keyframes`
  0% {
    transform: rotate(-120deg);
  }
  50% {
    transform: rotate(60deg);
  }
  100% {
    transform: rotate(-120deg);
  }
`;

// Add SVG path function for road
const roadLine = (theme: any) => `
  linear-gradient(90deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 0%, 
    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 40%, 
    transparent 40%,
    transparent 60%,
    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 60%,
    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 100%)
`;

// Add new animations
const wrenchSpin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(90deg);
  }
  50% {
    transform: rotate(180deg);
  }
  75% {
    transform: rotate(270deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const toolBounce = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(10deg);
  }
`;

const cog = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const revCounter = keyframes`
  0% {
    height: 10%;
  }
  50% {
    height: 90%;
  }
  100% {
    height: 10%;
  }
`;

// Add these new animations
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const revealWidth = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const carSlide = keyframes`
  0% {
    transform: translateX(-150%);
  }
  30% {
    transform: translateX(10%);
  }
  70% {
    transform: translateX(10%);
  }
  100% {
    transform: translateX(150%);
  }
`;

const gearRotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const heartbeat = keyframes`
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
`;

const flicker = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

// Add these new animations for tools and the logout button
const wrenchWiggle = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-20deg);
  }
  75% {
    transform: rotate(20deg);
  }
`;

const logoutPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 10px 5px rgba(255, 0, 0, 0.3);
  }
`;

const hoverEffect = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
`;

// Interface for activity items
interface Activity {
  id: number;
  title: string;
  status: string;
  date: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [authorizedComponents, setAuthorizedComponents] = useState<string[]>([]);
  const [filteredComponents, setFilteredComponents] = useState(allComponents);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [tasksPending, setTasksPending] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [rpm, setRpm] = useState(0);
  const [toolAngle, setToolAngle] = useState(0);
  const [engineHealth, setEngineHealth] = useState(85);
  const [oilLevel, setOilLevel] = useState(65);
  const [activeTool, setActiveTool] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tokenExpiryWarning, setTokenExpiryWarning] = useState(false);
  
  const findMatchingComponents = useCallback((componentNames: string[]) => {
    // Create a Set to track components already added to prevent duplicates
    const addedComponentValues = new Set();
    
    // First try to match exact names
    const exactMatches = allComponents.filter(component => {
      if (componentNames.includes(component.value)) {
        addedComponentValues.add(component.value);
        return true;
      }
      return false;
    });
    
    // If we don't have enough exact matches, try partial matches
    if (exactMatches.length < componentNames.length) {
      const remainingNames = componentNames.filter(
        name => !exactMatches.some(match => match.value === name)
      );
      
      const partialMatches = allComponents.filter(component => {
        // Skip if this component was already added as an exact match
        if (addedComponentValues.has(component.value)) {
          return false;
        }
        
        // Check if this component matches any remaining component name
        const isMatch = remainingNames.some(name => 
          component.value.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(component.value.toLowerCase())
        );
        
        // If it matches, add to tracking set and return true
        if (isMatch) {
          addedComponentValues.add(component.value);
          return true;
        }
        
        return false;
      });
      
      // If we still don't have enough components, add some defaults
      if (exactMatches.length + partialMatches.length < componentNames.length) {
        const defaultComponents = allComponents.filter(component => 
          !addedComponentValues.has(component.value)
        ).slice(0, componentNames.length - (exactMatches.length + partialMatches.length));
        
        return [...exactMatches, ...partialMatches, ...defaultComponents];
      }
      
      return [...exactMatches, ...partialMatches];
    }
    
    return exactMatches;
  }, []);

  useEffect(() => {
    // Animation intervals
    let carInterval: NodeJS.Timeout;
    let toolInterval: NodeJS.Timeout;
    
    // Start animations
    setIsMoving(true);
    
    carInterval = setInterval(() => {
      setRpm(prevRpm => (prevRpm + 10) % 8000);
    }, 500);
    
    toolInterval = setInterval(() => {
      setToolAngle(prevAngle => (prevAngle + 15) % 360);
    }, 100);
    
    // Load recent activities with timeout
    const timer = setTimeout(() => {
      setRecentActivities([
        { id: 1, title: "Oil Change Completed", status: "Completed", date: "Today" },
        { id: 2, title: "Brake Inspection", status: "Pending", date: "Yesterday" },
        { id: 3, title: "Tire Rotation", status: "In Progress", date: "2 days ago" }
      ]);
      setLoading(false);
    }, 2000);
    
    // Parse token for user info
    const token = storageUtils.getAuthToken();
    if (token) {
      try {
        interface DecodedToken {
          name?: string;
          role?: string;
          [key: string]: any;
        }
        
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.name) {
          const nameParts = decodedToken.name.split(" ");
          setUserName(nameParts[0]);
        }
        setUserRole(decodedToken.role || "");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
    
    // Clean up intervals and timers
    return () => {
      clearInterval(carInterval);
      clearInterval(toolInterval);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Set random tasks stats for display
    setTasksCompleted(Math.floor(Math.random() * 15) + 10);
    setTasksPending(Math.floor(Math.random() * 8) + 2);
    
    const userData = storageUtils.getUserData();
    if (userData) {
      try {
        const role = userData.authorities[0];
        setUserRole(role);
        setUserName(userData.firstname || "");
        
        if (role === "ADMIN") {
          setFilteredComponents(allComponents);
        } else {
          const userComponents = userData.componentNames || [];
          setAuthorizedComponents(userComponents);
          
          // Use the helper function to find matching components
          const matchedComponents = findMatchingComponents(userComponents);
          setFilteredComponents(matchedComponents);
          
          console.log("User has access to:", userComponents);
          console.log("Matched components:", matchedComponents.map(c => c.value));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [findMatchingComponents]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate grid column sizes based on number of components
  const getGridColumns = () => {
    const count = filteredComponents.length;
    
    if (isMobile) {
      return count <= 2 ? 12 : 6; // 1 or a max of 2 columns on mobile
    } else if (isTablet) {
      if (count <= 3) return 4; // 3 columns
      return 4; // 3 columns  
    } else {
      if (count <= 4) return 3; // 4 columns
      if (count <= 8) return 3; // 4 columns
      return 2; // 6 columns for many items
    }
  };

  // Function to get the active tool icon
  const getToolIcon = (index: number) => {
    switch(index) {
      case 0:
        return <BuildIcon sx={{ fontSize: 24 }} />;
      case 1:
        return <ConstructionIcon sx={{ fontSize: 24 }} />;
      case 2:
        return <HandymanIcon sx={{ fontSize: 24 }} />;
      case 3:
        return <EngineeringIcon sx={{ fontSize: 24 }} />;
      default:
        return <BuildIcon sx={{ fontSize: 24 }} />;
    }
  };

  // Add a function to clear all possible cookies more thoroughly using useCallback
  const clearAllCookies = useCallback(() => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Clear each cookie with various domain/path combinations to ensure complete removal
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Clear for various path/domain combinations to ensure comprehensive removal
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    
    storageUtils.clearAuthData();
    
    clearAllCookies();
    
    console.log("User logged out at:", new Date().toISOString());
    
    setTimeout(() => {
      window.location.replace("/signin");
    }, 800); 
  }, [clearAllCookies]);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = storageUtils.getAuthToken();
      if (token) {
        try {
          const decodedToken = jwtDecode<any>(token);
          if (decodedToken.exp) {
            // Get current time in seconds
            const currentTime = Math.floor(Date.now() / 1000);
            // Check if token will expire in the next 5 minutes (300 seconds)
            const timeToExpiry = decodedToken.exp - currentTime;
            
            if (timeToExpiry < 300 && timeToExpiry > 0) {
              // Show warning if token expires soon
              setTokenExpiryWarning(true);
              
              // Set timeout to auto-logout when token expires
              const timeoutMs = timeToExpiry * 1000; // Convert to milliseconds
              const expiryTimeout = setTimeout(() => {
                handleLogout();
              }, timeoutMs);
              
              // Clear timeout on cleanup
              return () => clearTimeout(expiryTimeout);
            }
          }
        } catch (error) {
          console.error("Error checking token expiry:", error);
        }
      }
      
      // Return empty cleanup function if no timeout was set
      return () => {};
    };
    
    // Check immediately
    const cleanup = checkTokenExpiry();
    
    // Set interval for periodic checks
    const interval = setInterval(() => {
      // Clear previous cleanup
      cleanup();
      // Set new cleanup
      checkTokenExpiry();
    }, 60000); // Check every minute
    
    // Clear interval on component unmount
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [handleLogout]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(to bottom right, #1a202c, #2d3748)' 
          : 'linear-gradient(to bottom right, #f7fafc, #ebf4ff)',
        color: theme.palette.text.primary,
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Updated floating spanners/wrenches in background */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        right: '10%',
        color: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.03)' 
          : 'rgba(0,0,0,0.03)',
        fontSize: '100px',
        transform: 'rotate(15deg)',
        animation: `${float} 15s ease-in-out infinite`,
        zIndex: 0,
      }}>
        <HandymanIcon fontSize="inherit" />
      </Box>
      
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        left: '8%',
        color: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.04)' 
          : 'rgba(0,0,0,0.04)',
        fontSize: '80px',
        transform: 'rotate(-10deg)',
        animation: `${float} 12s ease-in-out infinite 1s`,
        zIndex: 0,
      }}>
        <ConstructionIcon fontSize="inherit" />
      </Box>
      
      <Box sx={{
        position: 'absolute',
        top: '50%',
        right: '5%',
        color: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.03)' 
          : 'rgba(0,0,0,0.03)',
        fontSize: '90px',
        transform: 'rotate(5deg)',
        animation: `${float} 18s ease-in-out infinite 0.5s`,
        zIndex: 0,
      }}>
        <EngineeringIcon fontSize="inherit" />
      </Box>

      {/* Enhanced rotating gears in background */}
      <Box sx={{
        position: 'absolute',
        top: -150,
        right: -150,
        opacity: 0.03,
        fontSize: '500px',
        color: theme.palette.primary.main,
        animation: `${gearRotate} 120s linear infinite`,
        zIndex: 0,
        filter: 'blur(1px)',
      }}>
        <MiscellaneousServicesIcon fontSize="inherit" />
      </Box>
      
      <Box sx={{
        position: 'absolute',
        bottom: -80,
        left: -80,
        opacity: 0.04,
        fontSize: '350px',
        color: theme.palette.secondary.main,
        animation: `${gearRotate} 100s linear infinite reverse`,
        zIndex: 0,
        filter: 'blur(1px)',
      }}>
        <BuildIcon fontSize="inherit" />
      </Box>
      
      {/* Add a third gear to make it more interesting */}
      <Box sx={{
        position: 'absolute',
        top: '60%',
        left: '30%',
        opacity: 0.025,
        fontSize: '250px',
        color: theme.palette.warning.main,
        animation: `${gearRotate} 80s linear infinite`,
        zIndex: 0,
        filter: 'blur(1px)',
      }}>
        <ConstructionIcon fontSize="inherit" />
      </Box>

      {/* Add some additional animated spanners/wrenches that float around */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '20%',
          opacity: 0.03,
          animation: `${float} 8s ease-in-out infinite alternate`,
          zIndex: 0,
          transform: 'rotate(15deg)',
          fontSize: '100px',
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.04)' 
            : 'rgba(0,0,0,0.04)',
        }}
      >
        <ConstructionIcon fontSize="inherit" />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          opacity: 0.04,
          animation: `${float} 10s ease-in-out infinite alternate-reverse`,
          zIndex: 0,
          transform: 'rotate(-10deg)',
          fontSize: '120px',
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.03)' 
            : 'rgba(0,0,0,0.03)',
        }}
      >
        <HandymanIcon fontSize="inherit" />
      </Box>

      <Container maxWidth="xl" sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3, md: 4 },
            borderRadius: 3,
            width: '100%',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.85))',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(255,255,255,0.7)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(31, 38, 135, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)',
            position: 'relative',
            overflow: 'hidden',
            "&:hover": {
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 48px rgba(0, 0, 0, 0.4)'
                : '0 12px 48px rgba(31, 38, 135, 0.15)',
              transform: 'translateY(-4px)',
            },
            "&::after": {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 50% 50%, ${theme.palette.primary.main}10, transparent 70%)`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            "&:hover::after": {
              opacity: 1,
            }
          }}
        >
          {/* Logout Button in the top-right corner */}
          <Tooltip 
            title={isLoggingOut ? "Logging out..." : "Logout"} 
            arrow 
            placement="left"
          >
            <Box
              onClick={!isLoggingOut ? handleLogout : undefined}
              sx={{
                position: 'absolute',
                top: 15,
                right: 15,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoggingOut ? 'default' : 'pointer',
                p: 1.2,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 59, 48, 0.15)'
                  : 'rgba(255, 59, 48, 0.1)',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 59, 48, 0.3)'
                  : 'rgba(255, 59, 48, 0.2)',
                animation: isLoggingOut ? `${pulse} 0.8s infinite` : 'none',
                opacity: isLoggingOut ? 0.7 : 1,
                '&:hover': !isLoggingOut ? {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 59, 48, 0.3)'
                    : 'rgba(255, 59, 48, 0.2)',
                  animation: `${logoutPulse} 1.5s infinite`,
                  transform: 'translateY(-3px)',
                  boxShadow: '0 5px 15px rgba(255, 59, 48, 0.4)',
                } : {}
              }}
            >
              {isLoggingOut ? (
                <CircularProgress 
                  size={24} 
                  color="error" 
                  thickness={5}
                  sx={{ 
                    opacity: 0.7,
                  }} 
                />
              ) : (
                <ExitToAppIcon 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 59, 48, 0.8)' : 'rgba(255, 59, 48, 0.7)',
                    fontSize: '1.8rem',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'rotate(90deg)',
                    }
                  }} 
                />
              )}
            </Box>
          </Tooltip>

          {/* Animated corner accents */}
          <Box sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 24,
            height: 24,
            borderTop: `2px solid ${theme.palette.primary.main}`,
            borderLeft: `2px solid ${theme.palette.primary.main}`,
            opacity: 0.7,
          }} />
          
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderTop: `2px solid ${theme.palette.secondary.main}`,
            borderRight: `2px solid ${theme.palette.secondary.main}`,
            opacity: 0.7,
          }} />
          
          <Box sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            width: 24,
            height: 24,
            borderBottom: `2px solid ${theme.palette.warning.main}`,
            borderLeft: `2px solid ${theme.palette.warning.main}`,
            opacity: 0.7,
          }} />
          
          <Box sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 24,
            height: 24,
            borderBottom: `2px solid ${theme.palette.success.main}`,
            borderRight: `2px solid ${theme.palette.success.main}`,
            opacity: 0.7,
          }} />

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            mb: 3,
            animation: `${slideUp} 0.6s ease-out forwards 0.2s`,
            opacity: 0,
          }}>
            <Box 
              sx={{ 
                position: 'relative',
                mb: { xs: 2, sm: 0 },
                mr: { xs: 0, sm: 3 },
              }}
            >
              <Avatar 
                sx={{ 
                  width: { xs: 64, sm: 72 }, 
                  height: { xs: 64, sm: 72 }, 
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 0 4px rgba(66, 153, 225, 0.2)',
                  zIndex: 2,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 0 6px rgba(66, 153, 225, 0.3), 0 0 20px rgba(66, 153, 225, 0.5)',
                  }
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </Avatar>
              
              {/* Avatar decorative elements */}
              {[...Array(4)].map((_, i) => (
                <Box 
                  key={i}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: theme.palette.primary.main,
                    opacity: 0.6 - (i * 0.1),
                    transform: 'translate(-50%, -50%) scale(1.3)',
                    animation: `${pulse} ${3 + i}s infinite ${i * 0.3}s`,
                    zIndex: 1,
                  }}
                />
              ))}
              
              {/* Decorative gear - make it wiggle on hover */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  color: theme.palette.primary.main,
                  opacity: 0.8,
                  animation: `${gearRotate} 10s linear infinite`,
                  zIndex: 3,
                  fontSize: 24,
                  '&:hover': {
                    animation: `${wrenchWiggle} 0.5s ease infinite`,
                  }
                }}
              >
                <BuildIcon fontSize="inherit" />
              </Box>
            </Box>
            
            <Box sx={{ 
              textAlign: { xs: 'center', sm: 'left' },
              position: 'relative',
              zIndex: 1,
            }}>
              <Box 
                sx={{ 
                  position: 'relative',
                  display: 'inline-block',
                  mb: 1,
                  perspective: '500px',
                }}
              >
                <Typography 
                  variant="h4" 
                  fontWeight="bold"
                  sx={{ 
                    position: 'relative',
                    display: 'inline-block',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #60a5fa, #e879f9)'
                      : 'linear-gradient(90deg, #1e40af, #7e22ce)',
                    backgroundSize: '200% auto',
                    animation: `${shimmer} 3s linear infinite`,
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: theme.palette.mode === 'dark'
                      ? '0 0 15px rgba(255,255,255,0.3)'
                      : '0 0 15px rgba(0,0,0,0.1)',
                  }}
                >
                  {getGreeting()}, {userName || "User"}
                </Typography>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: `linear-gradient(90deg, 
                      ${theme.palette.primary.main}, 
                      ${theme.palette.secondary.main})`,
                    animation: `${revealWidth} 1s ease-out forwards 0.5s, ${shimmer} 3s infinite 1s`,
                    transformOrigin: 'left center',
                    boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                  }}
                />
                
                {/* Animated car icon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    width: 30,
                    height: 30,
                    opacity: 0.5,
                    animation: `${float} 3s ease-in-out infinite`,
                    zIndex: -1,
                    '&:hover': {
                      animation: `${hoverEffect} 1s ease-in-out infinite`,
                      opacity: 0.8,
                    }
                  }}
                >
                  <DirectionsCarIcon sx={{ fontSize: 30, color: theme.palette.success.main }} />
                </Box>
              </Box>
              
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  position: 'relative',
                  opacity: 0,
                  animation: `${fadeIn} 0.5s ease-out forwards 0.7s`,
                }}
              >
                <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                  {userRole === "ADMIN" ? "Administrator" : "Employee"}
                </Box> Dashboard
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    ml: 1,
                    bgcolor: theme.palette.success.main,
                    animation: `${pulse} 2s infinite`,
                    boxShadow: `0 0 5px ${theme.palette.success.main}`,
                  }}
                />
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Enhanced title section */}
          <Box sx={{ 
            position: 'relative', 
            textAlign: 'center', 
            my: 3, 
            py: 1,
            animation: `${slideUp} 0.8s ease-out forwards 0.4s`,
            opacity: 0,
          }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 60px',
            }}>
              {/* Animated wrench indicators */}
              <Box sx={{
                position: 'absolute',
                left: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.success.main,
              }}>
                <Box sx={{
                  animation: `${gearRotate} 10s linear infinite`,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  <HandymanIcon fontSize="medium" />
                </Box>
                <Box sx={{
                  ml: -1,
                  animation: `${gearRotate} 15s linear infinite reverse`,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  <BuildIcon fontSize="medium" />
                </Box>
              </Box>
              
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' },
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #60a5fa, #e879f9, #60a5fa)'
                    : 'linear-gradient(45deg, #1e40af, #7e22ce, #1e40af)',
                  backgroundSize: '200% auto',
                  animation: `${shimmer} 5s linear infinite`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 0 20px rgba(255, 255, 255, 0.3)'
                    : '0 0 20px rgba(0, 0, 0, 0.1)',
                  padding: '0 20px',
                  position: 'relative',
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  display: 'inline-block',
                  width: { xs: 'auto', sm: 'auto' },
                  lineHeight: { xs: 1.3, sm: 1.5 },
                  '& .mobile-break': {
                    display: 'none',
                    [theme.breakpoints.down('sm')]: {
                      display: 'inline-block'
                    }
                  }
                }}
              >
                <span style={{ display: 'inline-block' }}>AUTO&nbsp;CAR</span>
                <span className="mobile-break"><br /></span>
                <span style={{ display: 'inline-block' }}>CARE&nbsp;POINT</span>
              </Typography>
              
              {/* Right animated wrench indicators */}
              <Box sx={{
                position: 'absolute',
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.error.main,
              }}>
                <Box sx={{
                  mr: -1,
                  animation: `${gearRotate} 15s linear infinite`,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  <MiscellaneousServicesIcon fontSize="medium" />
                </Box>
                <Box sx={{
                  animation: `${gearRotate} 10s linear infinite reverse`,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  <ConstructionIcon fontSize="medium" />
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {userRole === "EMPLOYEE" && (
          <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, animation: `${fadeIn} 0.6s ease-out` }}>
            <Paper 
              elevation={0} 
              sx={{
                p: { xs: 1.5, sm: 2 }, 
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
                backgroundSize: '200% 200%',
                animation: `${glitter} 3s ease infinite`,
                color: 'white',
                textAlign: 'center',
                width: '100%',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                "&:hover": {
                  transform: 'scale(1.01)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <Typography variant="body1">
                You have access to {authorizedComponents.length} service modules
              </Typography>
            </Paper>
          </Box>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%', mx: 'auto' }}>
          {filteredComponents.map((card, index) => (
            <Grid item xs={getGridColumns()} sm={4} md={3} key={index} 
              sx={{ 
                animation: `${slideUp} 0.5s ease-out forwards ${0.1 + index * 0.08}s`,
                opacity: 0,
              }}
            >
              <Tooltip 
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="subtitle2">{card.value}</Typography>
                    <Typography variant="body2">{card.description}</Typography>
                  </Box>
                } 
                placement="top" 
                arrow
              >
                <Card
                  sx={{
                    height: { xs: 150, sm: 170 },
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${getCardGlowColor(index).replace('0.8', '0.1')} 0%, rgba(15,23,42,0.95) 100%)`
                      : `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, ${getCardGlowColor(index).replace('0.8', '0.05')} 100%)`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                      : '0 4px 20px rgba(0, 0, 0, 0.07)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(0,0,0,0.03)',
                    "&::before": {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: getCardGlowColor(index),
                      opacity: 0.7,
                      transition: 'height 0.3s ease, opacity 0.3s ease',
                      zIndex: 1,
                    },
                    "&::after": {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `radial-gradient(circle at 50% 0%, ${getCardGlowColor(index).replace('0.8', '0.15')}, transparent 70%)`,
                      opacity: 0.5,
                      zIndex: 0,
                    },
                    "&:hover": {
                      transform: "translateY(-8px) scale(1.02)",
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 15px 30px rgba(0, 0, 0, 0.4), 0 0 15px ${getCardGlowColor(index).replace('0.8', '0.3')}`
                        : `0 15px 30px rgba(0, 0, 0, 0.15), 0 0 15px ${getCardGlowColor(index).replace('0.8', '0.2')}`,
                      borderColor: getCardGlowColor(index).replace('0.8', '0.3'),
                      "&::before": {
                        height: '6px',
                        opacity: 1
                      },
                      "& .icon-container": {
                        transform: "translateY(-5px) scale(1.1)",
                        background: theme.palette.mode === 'dark' 
                          ? `radial-gradient(circle, ${getCardGlowColor(index).replace('0.8', '0.3')} 0%, rgba(255,255,255,0.1) 70%)`
                          : `radial-gradient(circle, ${getCardGlowColor(index).replace('0.8', '0.15')} 0%, rgba(255,255,255,0.8) 70%)`,
                        boxShadow: `0 10px 20px ${getCardGlowColor(index).replace('0.8', '0.4')}`,
                      },
                      "& .card-title": {
                        color: theme.palette.mode === 'dark' 
                          ? getCardGlowColor(index).replace('0.8', '1') 
                          : getCardGlowColor(index).replace('0.8', '0.9'),
                        transform: "translateY(5px)",
                      },
                      "& .card-decoration": {
                        opacity: 0.8,
                        transform: "rotate(45deg) scale(1.2)",
                      },
                      "& .card-tool-icon": {
                        opacity: 1,
                        animation: `${wrenchWiggle} 1s ease infinite`,
                      }
                    }
                  }}
                >
                  {/* Add a small animated tool icon in the corner of each card */}
                  <Box 
                    className="card-tool-icon"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      width: 20,
                      height: 20,
                      opacity: 0.4,
                      zIndex: 5,
                      transition: 'all 0.3s ease',
                      transform: 'rotate(-25deg)',
                    }}
                  >
                    {index % 3 === 0 ? 
                      <BuildIcon sx={{ fontSize: 20, color: theme.palette.secondary.main }} /> : 
                      index % 3 === 1 ? 
                      <ConstructionIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} /> :
                      <HandymanIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                    }
                  </Box>
                  
                  <CardActionArea 
                    onClick={() => navigate(card.url)} 
                    sx={{ 
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: { xs: 2, sm: 3 },
                      position: 'relative',
                      zIndex: 1,
                      "&::after": {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)',
                        animation: `${shimmer} 3s linear infinite`,
                        zIndex: 0,
                      }
                    }}
                  >
                    {/* Decorative element in the background */}
                    <Box
                      className="card-decoration"
                      sx={{
                        position: 'absolute',
                        bottom: 5,
                        right: 5,
                        opacity: 0.1,
                        fontSize: 70,
                        color: getCardGlowColor(index).replace('0.8', '1'),
                        transform: "rotate(20deg)",
                        transition: "all 0.5s ease",
                        zIndex: 0,
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { fontSize: 'inherit' }
                      })}
                    </Box>
                    
                    <Box 
                      className="icon-container"
                      sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        borderRadius: '50%', 
                        mb: { xs: 2, sm: 2.5 },
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: theme.palette.mode === 'dark' 
                          ? `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`
                          : `linear-gradient(135deg, white, rgba(255,255,255,0.8))`,
                        transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        transform: "scale(1) translateZ(0)",
                        transformStyle: 'preserve-3d',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 8px 16px rgba(0,0,0,0.2), inset 0 0 10px rgba(255,255,255,0.05)'
                          : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 5px rgba(0,0,0,0.05)',
                        position: 'relative',
                        zIndex: 2,
                        width: { xs: 55, sm: 70 },
                        height: { xs: 55, sm: 70 },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '5%',
                          left: '10%',
                          right: '10%',
                          height: '30%',
                          background: 'linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0))',
                          borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',
                          zIndex: 1,
                          opacity: theme.palette.mode === 'dark' ? 0.2 : 0.5,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: theme.palette.mode === 'dark'
                            ? `${getCardGlowColor(index).replace('0.8', '0.6')}`
                            : `${getCardGlowColor(index).replace('0.8', '0.3')}`,
                          opacity: 0.5,
                          animation: `${pulse} 3s infinite ${index * 0.3}s`,
                          boxShadow: `0 0 15px ${getCardGlowColor(index).replace('0.8', '0.2')}`,
                        }
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { 
                          ...card.icon.props.sx,
                          fontSize: { xs: 28, sm: 36 },
                          filter: card.urgent 
                            ? 'drop-shadow(0 0 5px rgba(255,0,0,0.7))' 
                            : `drop-shadow(0 2px 5px ${getCardGlowColor(index).replace('0.8', '0.3')})`,
                          animation: card.urgent ? `${flicker} 1.5s infinite` : 'none',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          zIndex: 2,
                          transform: 'translateZ(10px)',
                        }
                      })}
                    </Box>
                    <Typography 
                      className="card-title"
                      variant={isMobile ? "body1" : "h6"}
                      fontWeight="bold"
                      align="center"
                      sx={{ 
                        transition: "all 0.4s ease",
                        position: "relative",
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                        zIndex: 2,
                        mb: 0.5,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: -8,
                          left: "50%",
                          width: "40px",
                          height: "2px",
                          bgcolor: getCardGlowColor(index),
                          transform: "translateX(-50%)",
                          transition: "width 0.3s ease",
                          opacity: 0.8,
                        },
                        "&:hover::after": {
                          width: "60px"
                        }
                      }}
                    >
                      {card.value}
                    </Typography>
                    
                    {/* Add a short description preview */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        opacity: 0.7,
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                      }}
                    >
                      {card.description}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        {filteredComponents.length === 0 && (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              mt: 4, 
              borderRadius: 2, 
              textAlign: 'center',
              animation: `${fadeIn} 0.7s ease-out`,
            }}
          >
            <Typography variant="h6" color="error">
              You don't have access to any components. Please contact your administrator.
            </Typography>
          </Paper>
        )}

        <Box 
          sx={{ 
            mt: { xs: 4, sm: 5, md: 6 }, 
            pt: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            textAlign: 'center',
            animation: `${fadeIn} 0.8s ease-out`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Copyright © Auto Car Care Point {new Date().getFullYear()}. All rights reserved.
          </Typography>
        </Box>

        <Snackbar
          open={tokenExpiryWarning}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="warning" 
            variant="filled"
            sx={{ 
              width: '100%',
              alignItems: 'center',
              '& .MuiAlert-icon': { fontSize: '1.5rem' }
            }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setTokenExpiryWarning(false)}
                >
                  Dismiss
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  variant="outlined"
                  onClick={handleLogout}
                >
                  Logout Now
                </Button>
              </Box>
            }
          >
            Your session will expire soon. You will be automatically logged out.
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
