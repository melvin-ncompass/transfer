import { Box, Button, Drawer, Typography, useTheme } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { Iconify } from '../../components/iconify';
import { Logo } from '../../components/logo';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { PermissionName, getAllPermissionNames } from '../../types/permissions';
import { cxhNavMobileDrawerStyles } from '../../styles/layouts/cxh-nav-mobile-drawer.styles';
import { useSelector } from 'react-redux';

interface NavigationLink {
  href: string;
  label: string;
  requiredPermissions: string[];
  emoji: any;
}

const NAVIGATION_LINKS: NavigationLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    requiredPermissions: [PermissionName.DASHBOARD],
    emoji: <Iconify icon="solar:bedside-table-4-bold-duotone" />,
  },
  {
    href: '/datatable',
    label: 'Data',
    requiredPermissions: [PermissionName.DATA],
    emoji: <Iconify icon="solar:database-bold-duotone" />,
  },
  {
    href: '/config',
    label: 'Config',
    requiredPermissions: [PermissionName.CONFIG],
    emoji: <Iconify icon="solar:settings-bold-duotone" />,
  },
  {
    href: '/help',
    label: 'Help',
    requiredPermissions: [PermissionName.HELP],
    emoji: <Iconify icon="solar:question-circle-bold-duotone" />,
  },
];

const hasPermission = (
  userPermissions: { system?: string[]; business?: any[] } | undefined,
  requiredPermissions: string[]
): boolean => {
  if (!userPermissions) return false;

  // Extract all permission names from the nested structure
  const allPerms = getAllPermissionNames({
    system: userPermissions.system || [],
    business: userPermissions.business || [],
  });
  return requiredPermissions.some((perm) => allPerms.includes(perm));
};

export const CXHNavMobile = ({ drawer, toggleDrawer }: any) => {
  const theme = useTheme();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const userNavigation = useSelector((state: any) => state.auth.userNavigation);
  

  // Filter navigation links based on user permissions
  const allowedLinks = NAVIGATION_LINKS.filter((link) => {
    if (!user?.permissions) return false;
    return hasPermission(user.permissions, link.requiredPermissions);
  });
  return (
    <Drawer open={drawer} onClose={toggleDrawer(false)}>
      <Box sx={cxhNavMobileDrawerStyles.drawerContainer}>
        <Box sx={cxhNavMobileDrawerStyles.headerContainer}>
          <Logo sx={{ pt: 0.2 }} href={userNavigation} onClick={toggleDrawer(false)}/>
          <Button variant="text" onClick={toggleDrawer(false)} sx={cxhNavMobileDrawerStyles.closeButton}>
            <Iconify icon="mingcute:close-line" />
          </Button>
        </Box>
        <Box sx={cxhNavMobileDrawerStyles.navLinksContainer}>
          {allowedLinks.map((link) => {
            const isActive = location.pathname === link.href || location.pathname.startsWith(link.href);
            return (
              <NavLink
                key={link.href}
                to={link.href}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: '12px',
                  paddingLeft: '6px',
                  textAlign: 'center',
                }}
                onClick={toggleDrawer(false)}
              >
                <Box
                  sx={cxhNavMobileDrawerStyles.navLinkBox(theme, isActive)}
                >
                  {link.emoji}
                  <Typography variant="h5">{link.label}</Typography>
                </Box>
              </NavLink>
            );
          })}
        </Box>
      </Box>
    </Drawer>
  );
};
