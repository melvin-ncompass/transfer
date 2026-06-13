import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { AccountBalance, SwapHoriz, Analytics } from '@mui/icons-material';
import { useGetHeaderDataQuery } from '../../../../features/company/api/company.api';
import { useGetEmployeeInfoQuery } from '../../../../features/people/api/people.api';
import type { RootState } from '../../../../store/store';
import { usePermission } from '../../../../context/PermissionContext';
// ==============================|| NAVIGATION SECTION ||============================== //
export default function NavigationSection() {
  const theme = useTheme();
  const {permissions} =  usePermission();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(-1);

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const { data: headerData } = useGetHeaderDataQuery(undefined, {
    skip: !accessToken,
  });
  const { data: employeeInfo } = useGetEmployeeInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isEmployeeNonAdmin =
    employeeInfo?.data?.isEmployee === true && employeeInfo?.data?.isAdmin !== true;
  useEffect(() => {
    const handler = () => setActiveNav(-1);
    window.addEventListener('profileClicked', handler);
    return () => window.removeEventListener('profileClicked', handler);
  }, []);
  useEffect(() => {
    const currentPath = location.pathname;
    const index = menuItems.findIndex(item => {
      const basePath = item.path.split('/').slice(0, 3).join('/');
      return currentPath.includes(basePath);
    });
    setActiveNav(index);
  }, [location.pathname]);

  const hasCompany = headerData?.data?.companyName;
  
  const menuItems = [
    ...(permissions.includes("view_transactions") ? [{ label: 'Transact', path: '/books/transact/home', icon: <SwapHoriz /> }] : []),
    ...(permissions.includes("view_coa") ? [{ label: 'Accounts', path: '/books/coa/home', icon: <AccountBalance /> }] : []),
    ...(permissions.includes("view_insights") ? [{ label: 'Insights', path: '/books/insights', icon: <Analytics /> }] : []),
  ];
  const handleMenuClick = (path: string, index: number) => {
    setActiveNav(index);
    window.dispatchEvent(new CustomEvent('navClicked'));
    navigate(path);
  };
  if (isMobile || !hasCompany || isEmployeeNonAdmin) {
    return null;
  }
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mx: 2,
      }}
    >
      {menuItems.map((item, index) => (
        <Button
          key={item.label}
          onClick={() => handleMenuClick(item.path, index)}
          startIcon={item.icon}
          sx={{
            color: activeNav === index ? theme.palette.primary.main : theme.palette.text.primary,
            fontWeight: 500,
            px: 2,
            py: 1,
            borderRadius: 1,
            borderBottom: activeNav === index ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
            backgroundColor: activeNav === index ? theme.palette.action.selected : 'transparent',
            transition: 'all 0.3s ease',
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
}
