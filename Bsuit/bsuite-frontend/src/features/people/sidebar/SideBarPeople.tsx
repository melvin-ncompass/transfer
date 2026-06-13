import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import {
  Home,
  Group,
  Mail,
  AccessTime,
  AttachMoney,
  Description,
  CalendarMonth,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Person,
  Business,
  Dashboard,
  Approval,
} from "@mui/icons-material";
import DashboardCustomizeTwoToneIcon from "@mui/icons-material/DashboardCustomizeTwoTone";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { useGetEmployeeInfoQuery } from "../api/people.api";

/* =========================
   STYLED COMPONENTS
========================= */

const SidebarContainer = styled(Box)(({ theme }) => ({
  height: "100%",
  background: theme.palette.secondary.main,
  position: "sticky",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  borderRight: "1px solid rgba(255,255,255,0.06)",
}));

const MenuButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active, theme }) => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  position: "relative",
  transition: "all 0.25s ease",
  background: active ? "rgba(255,255,255,0.08)" : "transparent",

  "&:hover": {
    background: "rgba(255,255,255,0.06)",
  },

  "&::before": active
    ? {
        content: '""',
        position: "absolute",
        left: -12,
        top: 8,
        bottom: 8,
        width: 4,
        borderRadius: 6,
        background: theme.palette.primary.main,
      }
    : {},
}));

/* =========================
   TYPES
========================= */

interface MenuItemType {
  id: number;
  label: string;
  icon: React.ReactNode;
  children?: MenuItemType[];
}

interface Props {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  activeItem: number;
  setCurrentComponent: React.Dispatch<React.SetStateAction<number>>;
}

/* =========================
   COMPONENT
========================= */

export default function PremiumSidebar({
  collapsed,
  setCollapsed,
  activeItem,
  setCurrentComponent,
}: Props) {
  const theme = useTheme();
  const [openMenus, setOpenMenus] = useState<number[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive breakpoints
  const isLaptop = useMediaQuery("(max-height: 900px)");

  // Dynamic sizing based on viewport
  const sizing = {
    collapsedWidth: isLaptop ? 64 : 80,
    expandedWidth: isLaptop ? 220 : 260,
    iconSize: isLaptop ? "20px" : "24px",
    buttonPadding: isLaptop ? "8px 12px" : "12px 16px",
    buttonGap: isLaptop ? 10 : 14,
    buttonMargin: isLaptop ? "0 8px" : "0 12px",
    borderRadius: isLaptop ? 8 : 12,
    containerGap: isLaptop ? 1 : 2,
    logoHeight: isLaptop ? 56 : 70,
    logoFontSize: isLaptop ? 16 : 18,
    textFontSize: isLaptop ? 13 : 14,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnchorEl(event.currentTarget);
    setActiveMenuId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      handleMenuClose();
    }, 200);
  };

  const toggleOpen = (id: number) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const { data: employeePortalInfo, isSuccess: employeeInfoLoaded } =
    useGetEmployeeInfoQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  const isAdmin = employeePortalInfo?.data?.isAdmin === true;
  const isManager = employeePortalInfo?.data?.isManager === true;
  const isEmployee = employeePortalInfo?.data?.isEmployee === true;

  /** Approvals — reporting managers, or admin users who are also portal employees (different API for the latter). */
  const showApprovals = isManager || (isAdmin && isEmployee);
  /** Non-admin employees and reporting managers: same slim menu; managers also get Approvals via showApprovals. */
  const useRestrictedPeopleMenu =
    !isAdmin && (isEmployee || isManager);
  /** Home / Me need an employee record; hide once we know the user is not an employee. */
  const hideHomeAndMe =
    employeeInfoLoaded && employeePortalInfo?.data?.isEmployee !== true;

  const baseMenuItems: MenuItemType[] = [
    { id: 1, label: "Dashboard", icon: <Dashboard /> },
    { id: 2, label: "Home", icon: <Home /> },
    { id: 3, label: "Me", icon: <Person /> },
    { id: 4, label: "Organization", icon: <Business /> },
    { id: 5, label: "Inbox", icon: <Mail /> },
    ...(showApprovals ? [{ id: 10, label: "Approvals", icon: <Approval /> }] : []),
    { id: 6, label: "Time", icon: <AccessTime /> },
    {
      id: 7,
      label: "Salary",
      icon: <AttachMoney />,
      children: [
        { id: 71, label: "PayRun", icon: <SimCardDownloadIcon /> },
        { id: 72, label: "Structure", icon: <DashboardCustomizeTwoToneIcon /> },
      ],
    },
    { id: 8, label: "Reports", icon: <Description /> },
    { id: 9, label: "Project & Timesheets", icon: <CalendarMonth /> },
  ];

  const menuItems = baseMenuItems;

  const idsToHideForRestrictedRole = [1, 6, 7, 8, 9];
  const idsToHideHomeMeWhenNotEmployee = [2, 3];
  const filteredMenuItems = menuItems.filter((item) => {
    if (useRestrictedPeopleMenu && idsToHideForRestrictedRole.includes(item.id))
      return false;
    if (hideHomeAndMe && idsToHideHomeMeWhenNotEmployee.includes(item.id))
      return false;
    return true;
  });
  const renderItems = (items: MenuItemType[], level = 0) =>
    items.map((item) => {
      const isActive =
        activeItem === item.id ||
        item.children?.some((c) => c.id === activeItem);

      const isOpen = openMenus.includes(item.id);

      return (
        <Box key={item.id}>
          <Tooltip
            title={collapsed && !item.children ? item.label : ""}
            placement="right"
          >
            <MenuButton
              active={isActive}
              onMouseEnter={(e) => {
                if (collapsed && item.children) {
                  handleMenuOpen(e, item.id);
                }
              }}
              onMouseLeave={() => {
                if (collapsed && item.children) {
                  handleMouseLeave();
                }
              }}
              onClick={() => {
                if (collapsed && item.children) {
                  // Do nothing on click for collapsed parent with children (hover handles it)
                } else if (item.children) {
                  toggleOpen(item.id);
                } else {
                  setCurrentComponent(item.id);
                }
              }}
              sx={{
                justifyContent: "flex-start",
                gap: `${sizing.buttonGap}px`,
                padding: sizing.buttonPadding,
                paddingLeft: level > 0 ? "48px" : undefined,
                margin: sizing.buttonMargin,
                borderRadius: `${sizing.borderRadius}px`,
              }}
            >
              <Box
                sx={{
                  color: isActive
                    ? theme.palette.primary.main
                    : "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: sizing.iconSize,
                  "& > svg": {
                    fontSize: sizing.iconSize,
                  },
                }}
              >
                {item.icon}
              </Box>

              {!collapsed && (
                <>
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: sizing.textFontSize,
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: 0.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      opacity: collapsed ? 0 : 1,
                      visibility: collapsed ? "hidden" : "visible",
                      transition: "opacity 0.2s 0.1s, visibility 0.2s 0.1s",
                    }}
                  >
                    {item.label}
                  </Typography>

                  {item.children &&
                    (isOpen ? (
                      <ExpandLess sx={{ fontSize: sizing.iconSize }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: sizing.iconSize }} />
                    ))}
                </>
              )}
            </MenuButton>
          </Tooltip>

          {item.children && !collapsed && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              {renderItems(item.children, level + 1)}
            </Collapse>
          )}
        </Box>
      );
    });

  return (
    <SidebarContainer
      sx={{
        width: collapsed ? sizing.collapsedWidth : sizing.expandedWidth,
        borderRadius: "8px",
      }}
    >
      {/* LOGO */}
      <Box
        sx={{
          height: sizing.logoHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {!collapsed && (
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: sizing.logoFontSize,
              letterSpacing: 1,
            }}
          >
            PEOPLE
          </Typography>
        )}

        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            color: "#fff",
            fontSize: sizing.iconSize,
            "& > svg": {
              fontSize: sizing.iconSize,
            },
          }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* MENU */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: sizing.containerGap,
        }}
      >
        {renderItems(filteredMenuItems)}
      </Box>

      {/* COLLAPSED MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          pointerEvents: "none",
          "& .MuiPaper-root": {
            pointerEvents: "auto",
            backgroundColor: theme.palette.secondary.main,
            color: "#fff",
            marginLeft: 2,
            boxShadow: theme.shadows[8],
            borderRadius: `${sizing.borderRadius}px`,
            padding: "6px",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
        slotProps={{
          list: {
            onMouseEnter: () => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            },
            onMouseLeave: handleMouseLeave,
          },
        }}
      >
        {menuItems
          .find((item) => item.id === activeMenuId)
          ?.children?.map((child) => (
            <MenuItem
              key={child.id}
              onClick={() => {
                setCurrentComponent(child.id);
                handleMenuClose();
              }}
              selected={activeItem === child.id}
              sx={{
                gap: sizing.buttonGap / 7,
                borderRadius: `${sizing.borderRadius}px`,

                transform: "translateX(0)",
                transition:
                  "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&.Mui-selected": {
                  backgroundColor: "rgba(255,255,255,0.08) !important",
                },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                  // transform: "translateX(4px)",
                },
                color:
                  activeItem === child.id
                    ? theme.palette.primary.main
                    : "rgba(255,255,255,0.7)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "inherit",
                  fontSize: sizing.iconSize,
                  "& > svg": {
                    fontSize: sizing.iconSize,
                  },
                }}
              >
                {child.icon}
              </Box>
              <Typography
                sx={{
                  color: "inherit",
                  fontSize: sizing.textFontSize,
                  fontWeight: activeItem === child.id ? 600 : 500,
                  letterSpacing: 0.3,
                }}
              >
                {child.label}
              </Typography>
            </MenuItem>
          ))}
      </Menu>

      {/* FOOTER */}
    </SidebarContainer>
  );
}
