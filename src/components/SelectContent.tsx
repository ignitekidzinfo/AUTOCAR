import * as React from 'react';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { styled, keyframes, useTheme } from '@mui/material/styles';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SettingsIcon from '@mui/icons-material/Settings';
import useMediaQuery from '@mui/material/useMediaQuery';

// Keyframes for animations with performance optimizations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0px); }
`;

const shine = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// High-contrast color sets that meet WCAG standards
const COLORS = {
  // High contrast colors that pass WCAG AA standards
  DARK_PRIMARY: '#0d47a1', // Darker blue for better contrast
  MEDIUM_PRIMARY: '#1565c0',
  LIGHT_PRIMARY: '#42a5f5',
  CONTRAST_TEXT: '#ffffff',
  HOVER_LIGHT: 'rgba(21, 101, 192, 0.08)',
  HOVER_DARK: 'rgba(66, 165, 245, 0.12)',
  SHADOW: 'rgba(13, 71, 161, 0.3)'
};

// Cross-browser compatible gradient text mixin
const gradientTextMixin = {
  background: `linear-gradient(90deg, ${COLORS.DARK_PRIMARY}, ${COLORS.LIGHT_PRIMARY}, ${COLORS.DARK_PRIMARY})`,
  backgroundSize: '200% auto',
  // Standard
  backgroundClip: 'text',
  textFillColor: 'transparent',
  // Webkit (Chrome, Safari, newer versions of Opera, Edge)
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  // Mozilla
  MozBackgroundClip: 'text',
  MozTextFillColor: 'transparent',
  // Microsoft
  msBackgroundClip: 'text',
  msTextFillColor: 'transparent',
};

// Styled component for the logo container - optimized for accessibility
const LogoContainer = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: COLORS.DARK_PRIMARY,
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  width: '100%', // Take full width of parent
  minWidth: '180px', // Ensure minimum width for text
  maxWidth: '240px', // Maximum width constraint
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.2s ease',
  position: 'relative',
  outline: 'none', // Will be shown only on keyboard focus
  '&:focus-visible': {
    outline: `2px solid ${COLORS.MEDIUM_PRIMARY}`,
    outlineOffset: '2px',
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? COLORS.HOVER_DARK 
      : COLORS.HOVER_LIGHT,
    '& .car-icon': {
      transform: 'translateZ(5px)',
    },
    '& .gear-icon': {
      transform: 'rotate(45deg)',
    },
    '& .logo-text': {
      backgroundSize: '200% auto',
      animation: `${shine} 2s linear infinite`,
    }
  }
}));

// Styled car icon container with improved contrast and focus states
const CarIconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${COLORS.MEDIUM_PRIMARY}, ${COLORS.DARK_PRIMARY})`,
  color: COLORS.CONTRAST_TEXT,
  borderRadius: '12px',
  width: 32, // Slightly smaller to give more room for text
  height: 32, // Maintain square aspect ratio
  flexShrink: 0, // Prevent icon from shrinking
  boxShadow: `0 3px 6px ${COLORS.SHADOW}`,
  position: 'relative',
  zIndex: 1,
  transform: 'translateZ(0)',
  transition: 'all 0.2s ease',
  animation: `${float} 3s ease-in-out infinite`,
  willChange: 'transform', // Performance optimization for animations
}));

// Styled gear icon for car maintenance theme
const GearIcon = styled(SettingsIcon)(({ theme }) => ({
  position: 'absolute',
  fontSize: '0.8rem', // Smaller size to match reduced icon size
  top: -3,
  right: -3,
  color: COLORS.LIGHT_PRIMARY,
  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
  transition: 'transform 0.4s ease',
  transform: 'rotate(0deg)',
  willChange: 'transform', // Performance optimization for animations
}));

interface SelectContentProps {
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ className }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isSidebarCollapsed = useMediaQuery('(max-width: 270px)');
  
  // Shortened version for very small spaces
  const logoText = isSidebarCollapsed ? "Auto Care" : "Auto Car Care Point";
  
  // Error handling for animation fallback
  const [animationsEnabled, setAnimationsEnabled] = React.useState(true);
  
  React.useEffect(() => {
    // Detect if animations might cause performance issues
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAnimationsEnabled(!prefersReducedMotion);
  }, []);

  return (
    <LogoContainer 
      to="/" 
      className={className}
      aria-label="Auto Car Care Point - Return to home page"
    >
      <CarIconContainer className="logo-icon-container">
        <DirectionsCarIcon 
          className="car-icon"
          fontSize="small" 
          aria-hidden="true"
          sx={{ 
            fontSize: '1rem',
            transform: 'translateZ(0)',
            transition: 'transform 0.2s ease'
          }} 
        />
        <GearIcon 
          className="gear-icon" 
          aria-hidden="true"
          sx={{
            animation: animationsEnabled ? undefined : 'none'
          }}
        />
      </CarIconContainer>
      <Typography 
        variant={isSmallScreen ? "body2" : "body1"}
        fontWeight="bold"
        component="span"
        className="logo-text"
        sx={{ 
          position: 'relative',
          zIndex: 1,
          fontSize: isSidebarCollapsed ? '0.75rem' : isSmallScreen ? '0.85rem' : '0.95rem',
          flexShrink: 1, // Allow some shrinking if needed
          flexGrow: 0, // Don't expand to fill space
          maxWidth: '100%', // Take available width
          ...gradientTextMixin,
          letterSpacing: isSidebarCollapsed ? 0 : 0.3,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis', // Show ellipsis if text gets cut
          // Fallback for browsers that don't support gradient text
          '@supports not (background-clip: text)': {
            color: COLORS.DARK_PRIMARY,
            background: 'none'
          },
          // Disable animations if user prefers reduced motion
          animation: animationsEnabled ? undefined : 'none'
        }}
      >
        {logoText}
      </Typography>
    </LogoContainer>
  );
};

// Performance optimization to prevent unnecessary re-renders
export default React.memo(SelectContent);
