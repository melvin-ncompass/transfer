import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Close,
  AccountBalance,
  SwapHoriz,
  Analytics,
  ExpandLess,
  ExpandMore,
  Dashboard,
  Home,
  Person,
  Mail,
  Approval,
  CalendarMonth,
  AccessTime,
  Description,
  SimCardDownload,
  DashboardCustomizeTwoTone,
  Business,
} from "@mui/icons-material";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  Collapse,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { useGetEmployeeInfoQuery } from "../../features/people/api/people.api";

type MenuItem = {
  label: string;
  icon?: ReactNode;
  path?: string;
  tabId?: number;
  children?: { label: string; path: string; icon?: ReactNode; tabId?: number }[];
};

function DrawerList({ closeDrawer }: { closeDrawer: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data: employeeInfo, isSuccess: employeeInfoLoaded } =
    useGetEmployeeInfoQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  /* =========================
     ROLE FLAGS (MATCH SIDEBAR)
  ========================= */

  const isAdmin = employeeInfo?.data?.isAdmin === true;
  const isManager = employeeInfo?.data?.isManager === true;
  const isEmployee = employeeInfo?.data?.isEmployee === true;

  const showApprovals = isManager || (isAdmin && isEmployee);

  const useRestrictedPeopleMenu =
    !isAdmin && (isEmployee || isManager);

  const hideHomeAndMe =
    employeeInfoLoaded && employeeInfo?.data?.isEmployee !== true;

  /* =========================
     ROUTE CHECK
  ========================= */

  const currentUrl = location.pathname.toLowerCase();
  const isPeople = currentUrl.includes("/people");

  /* =========================
     DEFAULT (NON-PEOPLE)
  ========================= */

  const menuItems:MenuItem[] = [
    { label: "Transact", path: "/books/transact/home", icon: <SwapHoriz /> },
    { label: "Accounts", path: "/books/coa/home", icon: <AccountBalance /> },
    { label: "Insights", path: "/books/insights", icon: <Analytics /> },
  ];

  /* =========================
     PEOPLE MENU
  ========================= */

  /** Keep in sync with `SideBarPeople.tsx` `baseMenuItems` order. */
  const peopleMenuItems: MenuItem[] = [
    { label: "Dashboard", icon: <Dashboard />, path: "/people/home?tab=1", tabId: 1 },
    { label: "Home", icon: <Home />, path: "/people/home?tab=2", tabId: 2 },
    { label: "Me", icon: <Person />, path: "/people/home?tab=3", tabId: 3 },
    { label: "Organization", icon: <Business />, path: "/people/home?tab=4", tabId: 4 },
    { label: "Inbox", icon: <Mail />, path: "/people/home?tab=5", tabId: 5 },
    ...(showApprovals
      ? [
          {
            label: "Approvals",
            icon: <Approval />,
            path: "/people/home?tab=10",
            tabId: 10,
          },
        ]
      : []),
    { label: "Time", icon: <AccessTime />, path: "/people/home?tab=6", tabId: 6 },
    {
      label: "Salary",
      icon: <AccountBalance />,
      path: "/people/home?tab=7",
      tabId: 7,
      children: [
        {
          label: "PayRun",
          path: "/people/home?tab=71",
          icon: <SimCardDownload />,
          tabId: 71,
        },
        {
          label: "Structure",
          path: "/people/home?tab=72",
          icon: <DashboardCustomizeTwoTone />,
          tabId: 72,
        },
      ],
    },
    { label: "Reports", icon: <Description />, path: "/people/home?tab=8", tabId: 8 },
    {
      label: "Project & Timesheets",
      icon: <CalendarMonth />,
      path: "/people/home?tab=9",
      tabId: 9,
    },
  ];

  /* =========================
     FILTERING (MATCH SIDEBAR)
  ========================= */

  const idsToHideForRestrictedRole = [1, 6, 7, 8, 9];
  const idsToHideHomeMeWhenNotEmployee = [2, 3];

  const peopleMenuItemsFiltered = peopleMenuItems.filter((item) => {
    if (
      useRestrictedPeopleMenu &&
      item.tabId &&
      idsToHideForRestrictedRole.includes(item.tabId)
    ) {
      return false;
    }

    if (
      hideHomeAndMe &&
      item.tabId &&
      idsToHideHomeMeWhenNotEmployee.includes(item.tabId)
    ) {
      return false;
    }

    return true;
  });

  const peopleMenuItemsForUser = peopleMenuItemsFiltered;

  /* =========================
     COMPANIES
  ========================= */

  const companiesMenuItem: MenuItem = {
    label: "All Companies",
    icon: <Business />,
    path: "/company/home",
  };

  /* =========================
     FINAL MENU
  ========================= */

  const isEmployeeNonAdmin =
    isEmployee && !isAdmin;

  const drawerMenuItems =
    isEmployeeNonAdmin
      ? [...peopleMenuItemsForUser]
      : isPeople
        ? peopleMenuItemsForUser
        : menuItems;

  /* =========================
     HANDLERS
  ========================= */

  const handleClick = (path: string) => {
    navigate(path);
    closeDrawer();
    window.dispatchEvent(new CustomEvent("navClicked"));
  };

  const handleToggle = (label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  };

  /* =========================
     UI
  ========================= */

  return (
    <Box sx={{ width: 250 }} role="presentation">
      <Stack direction="row" justifyContent="flex-end" p={1}>
        <IconButton onClick={closeDrawer}>
          <Close color="primary" />
        </IconButton>
      </Stack>

      <List>
        {drawerMenuItems.map((item) => (
          <Box key={item.label}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() =>
                  item.children
                    ? handleToggle(item.label)
                    : item.path && handleClick(item.path)
                }
              >
                {item.icon && (
                  <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                    {item.icon}
                  </ListItemIcon>
                )}

                <ListItemText primary={item.label} />

                {item.children &&
                  (openMenu === item.label ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>

            {item.children && (
              <Collapse
                in={openMenu === item.label}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.label} disablePadding sx={{ pl: 4 }}>
                      <ListItemButton onClick={() => handleClick(child.path)}>
                        {child.icon && (
                          <ListItemIcon
                            sx={{ color: theme.palette.primary.main }}
                          >
                            {child.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
}

export default DrawerList;