import { PermissionEnum } from '../enum/enum';

export const menuConfig = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    allowedPermissions: [
      PermissionEnum.MANAGE_DASHBOARD,
      PermissionEnum.MANAGE_OVERVIEW,
      PermissionEnum.MANAGE_DECKGL,
      PermissionEnum.MANAGE_LEAFLET,
      PermissionEnum.MANAGE_GOOGLE_MAP,
      PermissionEnum.MANAGE_CLIMATE,
      PermissionEnum.MANAGE_TIMESERIES,
      PermissionEnum.MANAGE_PROMPTS,
      PermissionEnum.MANAGE_CLIMATE_AND_HEALTH,
    ],
  },
  {
    title: 'Data',
    path: '/datatable',
    allowedPermissions: [PermissionEnum.MANAGE_DATA],
  },
  {
    title: 'Config',
    path: '/config',
    allowedPermissions: [PermissionEnum.MANAGE_CONFIG],
  },
  {
    title: 'Help',
    path: '/help',
    allowedPermissions: [PermissionEnum.MANAGE_HELP],
  },
  {
    title: 'Users',
    path: '/users',
    allowedPermissions: [PermissionEnum.MANAGE_USERS],
  },
  {
    title: 'Roles',
    path: '/roles',
    allowedPermissions: [PermissionEnum.MANAGE_ROLES],
  },
  {
    title: 'Logs',
    path: '/logs',
    allowedPermissions: [PermissionEnum.READ_SESSION_LOGS],
  },
  {
    title: 'Profile',
    path: '/profile',
    allowedPermissions: [],
  },
  {
    title: 'Settings',
    path: '/settings',
    allowedPermissions: [PermissionEnum.MANAGE_SETTINGS],
  },
];
