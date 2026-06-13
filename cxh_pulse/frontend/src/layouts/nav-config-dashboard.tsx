import { SvgColor } from '../components/svg-color';
import { TbReportSearch } from "react-icons/tb";
import { styled } from '@mui/material';
import { FaUsersCog } from "react-icons/fa";
import { Iconify } from '../components/iconify';
import { PermissionName } from '../types/permissions';
// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  allowedPermissions?: string[];
};

const SvgRoot = styled('span')(() => ({
  width: 24,
  height: 24,
  flexShrink: 0,
  display: 'inline-flex',
  backgroundColor: 'currentColor',
}));


// Icon mapping for navigation items
const iconMap: Record<string, React.ReactNode> = {
  '/users': icon('ic-user'),
  '/roles': <FaUsersCog style={{ width: 24, height: 24 }} />,
  '/logs': <TbReportSearch style={{ width: 24, height: 24 }} />,
  '/profile': <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
  '/settings': <Iconify width={22} icon="solar:settings-bold-duotone" />,
};

// Static fallback navigation (used when API navigation is not available)
export const navData = [
  {
    title: 'User',
    path: '/users',
    icon: icon('ic-user'),
    allowedPermissions: [PermissionName.READ_USER],            
  },
  {
    title: 'Role',
    path: '/roles',
    icon: <FaUsersCog style={{ width: 24, height: 24 }} />,
    allowedPermissions: [PermissionName.READ_ROLES],
  },
  {
    title: 'Log',
    path: '/logs',
    icon: <TbReportSearch style={{ width: 24, height: 24 }} />,
    allowedPermissions: [PermissionName.READ_SESSION_LOGS, PermissionName.READ_ALL_SESSION_LOGS],
  },
  {
    title: 'Profile',
    path: '/profile',
    icon: <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
    allowedPermissions: [PermissionName.READ_PROFILE],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Iconify width={22} icon="solar:settings-bold-duotone" />,
    allowedPermissions: [PermissionName.READ_ALL_SETTINGS],
  },
];

// Convert API navigation to NavItem format
export const convertApiNavigationToNavData = (apiNavigation: Array<{
  title: string;
  path: string;
  allowedPermissions: string[];
}>): NavItem[] => apiNavigation.map(item => ({
  title: item.title,
  path: item.path,
  icon: iconMap[item.path] || icon('ic-user'), // Fallback icon
  allowedPermissions: item.allowedPermissions,
}));
