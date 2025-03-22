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

const mainListItems = [
  { text: "Dashboard", icon: <HomeIcon sx={{ color: "#1976d2" }} />, link: "/admin/dashboard" },
  { text: "Manage User", icon: <AnalyticsIcon sx={{ color: "#388e3c" }} />, link: "/admin/users" },
  {
    text: "Master",
    icon: <PeopleIcon sx={{ color: "#f57c00" }} />,
    subMenu: [
      { text: "Manage Service", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/spare-part/transaction/list" },
      { text: "Manage Repair", icon: <RepairIcon sx={{ color: "#FF5722" }} />, link: "/admin/manage-repair" },
      { text: "Manage Spares", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/manage-spares" },
      { text: "Manage Supplier", icon: <RepairIcon sx={{ color: "#d32f2f" }} />, link: "/admin/manage-supllier" },
      { text: "Manage Customer", icon: <RepairIcon sx={{ color: "#7b1fa2" }} />, link: "/admin/manage-customer" },
      { text: "Manage Stock", icon: <RepairIcon sx={{ color: "#00796b" }} />, link: "/admin/manage-stock" },
      { text: "Manage Terms & Conditions", icon: <RepairIcon sx={{ color: "#c2185b" }} />, link: "/admin/manage-condition" },
      { text: "Spare Sale Stock", icon: <RepairIcon sx={{ color: "#0288d1" }} />, link: "/admin/manage-stock" },
    ],
  },
  { 
    text: "Report",
    icon: <AssignmentIcon sx={{ color: "#d32f2f" }} />,
    subMenu: [
      { text: "Job Sales Report", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/manage-service" },
      { text: "Counter Sales Report", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/manage-repair" },
      { text: "Purchase Report", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/manage-repair" },
      { text: "Superwise/Technician Service Report", icon: <RepairIcon sx={{ color: "#d32f2f" }} />, link: "/admin/manage-repair" },
      { text: "Vehicle History", icon: <RepairIcon sx={{ color: "#7b1fa2" }} />, link: "/admin/manage-repair" },
    ]
  },
  { 
    text: "Account Report",
    icon: <AssignmentIcon sx={{ color: "#512da8" }} />,
    subMenu: [
      { text: "Sale Account Report", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/manage-service" },
      { text: "Purches Account Report", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/manage-repair" },
    ]
  },
  { 
    text: "Payment",
    icon: <AssignmentIcon sx={{ color: "#00acc1" }} />,
    subMenu: [
      { text: "Customer Payment", icon: <BuildIcon sx={{ color: "#1976d2" }} />, link: "/admin/manage-service" },
      { text: "Bank Deposit", icon: <RepairIcon sx={{ color: "#388e3c" }} />, link: "/admin/manage-repair" },
      { text: "Employee Payment", icon: <RepairIcon sx={{ color: "#f57c00" }} />, link: "/admin/manage-repair" },
    ]
  },
];

export default function MenuContent() {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);

  const handleToggle = (menuText: string) => {
    setOpenSubMenu((prev) => (prev === menuText ? null : menuText));
  };

  return (
    <Stack sx={{ flexGrow: 1, p: { xs: 1, sm: 2 }, justifyContent: "space-between" }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <React.Fragment key={index}>
            {!item.subMenu ? (
              <ListItem disablePadding sx={{ display: "block" }}>
                <NavLink
                  to={item.link}
                  style={{ textDecoration: "none", color: "inherit", width: "100%" }}
                >
                  <ListItemButton selected={location.pathname === item.link} sx={{ minHeight: 48 }}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </NavLink>
              </ListItem>
            ) : (
              <>
                <ListItem disablePadding sx={{ display: "block" }}>
                  <ListItemButton onClick={() => handleToggle(item.text)} sx={{ minHeight: 48 }}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                    {openSubMenu === item.text ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={openSubMenu === item.text} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subMenu.map((subItem, subIndex) => (
                      <ListItem key={subIndex} disablePadding sx={{ pl: 4 }}>
                        <NavLink
                          to={subItem.link}
                          style={{ textDecoration: "none", color: "inherit", width: "100%" }}
                        >
                          <ListItemButton selected={location.pathname === subItem.link} sx={{ minHeight: 48 }}>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        </NavLink>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </React.Fragment>
        ))}
      </List>
    </Stack>
  );
}
