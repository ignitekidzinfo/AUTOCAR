import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Collapse,
  Tooltip,
  Box,
} from "@mui/material";
import {
  HomeRounded as HomeIcon,
  AnalyticsRounded as AnalyticsIcon,
  PeopleRounded as PeopleIcon,
  AssignmentRounded as AssignmentIcon,
  BuildRounded as BuildIcon,
  MiscellaneousServicesRounded as RepairIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import storageUtils from '../utils/storageUtils';
import { useSidebar } from '../contexts/SidebarContext';

const mainListItems = [
  { text: "Dashboard", icon: <HomeIcon sx={{ color: "#1976d2" }} />, link: "/admin/dashboard" },
  { text: "Manage User", icon: <AnalyticsIcon sx={{ color: "#388e3c" }} />, link: "/admin/employeeList", adminOnly: true },
  {
    text: "Master",
    icon: <PeopleIcon sx={{ color: "#f57c00" }} />,
    subMenu: [
      { text: "Manage Service", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/services" },
      { text: "Manage Repair", icon: <RepairIcon sx={{ color: "#FF5722" }} />, link: "/admin/jobCardgrid" },
      { text: "Manage Spares", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/manage-stock" },
      { text: "Manage Supplier", icon: <RepairIcon sx={{ color: "#d32f2f" }} />, link: "/admin/manageVendor" },
      { text: "Manage Customer", icon: <RepairIcon sx={{ color: "#7b1fa2" }} />, link: "/admin/manage-customer" },
      { text: "Manage Notes", icon: <RepairIcon sx={{ color: "#00796b" }} />, link: "/admin/manage-Notes" },
      { text: "Manage Terms & Conditions", icon: <RepairIcon sx={{ color: "#c2185b" }} />, link: "/admin/manage-Terms" },
    //   { text: "Spare Sale Stock", icon: <RepairIcon sx={{ color: "#0288d1" }} />, link: "/admin/manage-stock" },
    ],
  },
  { 
    text: "Report",
    icon: <AssignmentIcon sx={{ color: "#d32f2f" }} />,
    subMenu: [
      { text: "Job Sales Report", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/jobsalereport" },
      { text: "Counter Sales Report", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/countersalereport" },
      { text: "Purchase Report", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/purchasereport" },
      { text: "Superwise/Technician Service Report", icon: <RepairIcon sx={{ color: "#d32f2f" }} />, link: "/admin/supertechservicereport" },
      { text: "Vehicle History", icon: <RepairIcon sx={{ color: "#7b1fa2" }} />, link: "/admin/vehiclehistorywithpdf" },
    ]
  },
  { 
    text: "Account Report",
    icon: <AssignmentIcon sx={{ color: "#512da8" }} />,
    subMenu: [
      { text: "Sale Account Report", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/manage-reports" },
      { text: "Purches Account Report", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/manage-purchaseaccountreport" },
    ]
  },
  { 
    text: "Payment",
    icon: <AssignmentIcon sx={{ color: "#00acc1" }} />,
    subMenu: [
      { text: "Customer Payment", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/manageborrow" },
      { text: "Bank Deposit", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/bank-deposits" },
      { text: "Employee Payment", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/manage-salary" },
    ]
  },
];

// Shared styles for menu items to ensure text visibility
const menuItemStyles = {
  color: '#333 !important',
  '&.Mui-selected': {
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    color: '#1976d2 !important'
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: '#333 !important'
  }
};

const listItemTextStyles = {
  '& .MuiTypography-root': { 
    color: '#333 !important',
    fontWeight: 500
  }
};

const subMenuItemStyles = {
  pl: 4,
  color: '#333 !important',
  '&.Mui-selected': {
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    color: '#1976d2 !important'
  }
};

export default function MenuContent() {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState("");
  const [authorizedComponents, setAuthorizedComponents] = React.useState<string[]>([]);
  const [filteredMenu, setFilteredMenu] = React.useState(mainListItems);
  const { sidebarOpen, openSidebar } = useSidebar();
  
  // Check if we're in a mobile drawer based on URL parameters or component props
  const isMobileMenu = React.useMemo(() => {
    return window.innerWidth < 600 || location.search.includes('mobile=true');
  }, [location.search]);

  React.useEffect(() => {
    // Get user permissions from userData
    const userData = storageUtils.getUserData();
    if (userData) {
      try {
        const role = userData.authorities[0];
        setUserRole(role);
        
        // If role is ADMIN, show all menu items
        if (role === "ADMIN") {
          setFilteredMenu(mainListItems);
        } else {
          // For EMPLOYEE, filter based on authorized components
          const userComponents = userData.componentNames || [];
          setAuthorizedComponents(userComponents);
          
          // Keep track of which main menu items have authorized sub-items
          const mainMenuWithAuthorizedSubItems = new Set<string>();
          
          // Filter the menu based on permissions
          const filtered = mainListItems
            .filter(item => {
              // Skip admin-only items for non-admin users
              if (item.adminOnly) return false;
              
              // Dashboard is always visible
              if (item.text === "Dashboard") return true;
              
              // For items without submenus, check if they're in authorized components
              if (!item.subMenu) {
                return userComponents.includes(item.text);
              }
              
              // For items with submenus, we'll check their contents later
              return true;
            })
            .map(item => {
              // For items without submenus, return as is
              if (!item.subMenu) return item;
              
              // For items with submenus, filter the submenu items
              const filteredSubMenu = item.subMenu.filter(subItem => 
                userComponents.includes(subItem.text)
              );
              
              // If there are authorized submenu items, keep the main menu item
              if (filteredSubMenu.length > 0) {
                mainMenuWithAuthorizedSubItems.add(item.text);
                return {
                  ...item,
                  subMenu: filteredSubMenu
                };
              }
              
              // Otherwise, remove the main menu item
              return null;
            }).filter(Boolean) as typeof mainListItems;
          
          setFilteredMenu(filtered);
          
          // Open the submenu if there's only one authorized report
          if (mainMenuWithAuthorizedSubItems.has("Report") && 
              filtered.find(item => item.text === "Report")?.subMenu?.length === 1) {
            setOpenSubMenu("Report");
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleToggle = (menuText: string) => {
    // If sidebar is not open, open it first
    if (!sidebarOpen) {
      openSidebar();
    }
    setOpenSubMenu((prev) => (prev === menuText ? null : menuText));
  };

  const handleMenuClick = () => {
    // If sidebar is not open, open it first before navigation
    if (!sidebarOpen) {
      openSidebar();
    }
  };

  // Render menu items with proper tooltips that don't interfere with clicking
  const renderMenuItem = (item: any, index: number) => {
    if (!item.subMenu) {
      // For regular menu items without submenu
      return (
        <ListItem key={index} disablePadding sx={{ display: "block" }}>
          {!sidebarOpen && !isMobileMenu ? (
            <Tooltip title={item.text} placement="right" arrow enterDelay={500} leaveDelay={200}>
              <ListItemButton
                component={NavLink}
                to={item.link}
                onClick={handleMenuClick}
                selected={location.pathname === item.link}
                sx={{ 
                  minHeight: 48,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  px: 2.5,
                  ...menuItemStyles,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: 1,
                      ...listItemTextStyles
                    }} 
                  />
                )}
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton
              component={NavLink}
              to={item.link}
              selected={location.pathname === item.link}
              sx={{ 
                minHeight: 48,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: 2.5,
                ...menuItemStyles,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: 1,
                  ...listItemTextStyles
                }} 
              />
            </ListItemButton>
          )}
        </ListItem>
      );
    } else {
      // For menu items with submenu
      return (
        <React.Fragment key={index}>
          <ListItem disablePadding sx={{ display: "block" }}>
            {!sidebarOpen && !isMobileMenu ? (
              <Tooltip title={item.text} placement="right" arrow enterDelay={500} leaveDelay={200}>
                <ListItemButton
                  onClick={() => handleToggle(item.text)}
                  sx={{ 
                    minHeight: 48,
                    justifyContent: sidebarOpen ? 'initial' : 'center',
                    px: 2.5,
                    ...menuItemStyles,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <>
                      <ListItemText 
                        primary={item.text} 
                        sx={{ 
                          opacity: 1,
                          ...listItemTextStyles
                        }} 
                      />
                      {openSubMenu === item.text ? (
                        <ExpandLess sx={{ color: '#555 !important' }} />
                      ) : (
                        <ExpandMore sx={{ color: '#555 !important' }} />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                onClick={() => handleToggle(item.text)}
                sx={{ 
                  minHeight: 48,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  px: 2.5,
                  ...menuItemStyles,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: 1,
                    ...listItemTextStyles
                  }} 
                />
                {openSubMenu === item.text ? (
                  <ExpandLess sx={{ color: '#555 !important' }} />
                ) : (
                  <ExpandMore sx={{ color: '#555 !important' }} />
                )}
              </ListItemButton>
            )}
          </ListItem>
          <Collapse in={openSubMenu === item.text} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subMenu.map((subItem: any, subIndex: number) => (
                <ListItemButton
                  key={subIndex}
                  component={NavLink}
                  to={subItem.link}
                  selected={location.pathname === subItem.link}
                  sx={{
                    ...subMenuItemStyles,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 3,
                      justifyContent: 'center',
                    }}
                  >
                    {subItem.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={subItem.text} 
                    sx={{
                      opacity: 1,
                      ...listItemTextStyles
                    }} 
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#f5f5f5 !important',
        '& *': {
          color: '#333 !important',
        }
      }}
    >
      <List
        sx={{
          width: '100%',
          bgcolor: '#f5f5f5 !important',
          color: '#333 !important',
          padding: 0
        }}
      >
        {filteredMenu.map(renderMenuItem)}
      </List>
    </Box>
  );
}
