import { Iconify } from '../components/iconify';
import { Permission } from '../types/permissions';

import type { AccountPopoverProps } from './components/account-popover';

// ----------------------------------------------------------------------

export const _account: AccountPopoverProps['data'] = [
  {
    label: 'Profile',
    href: '/profile',
    icon: <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
  },
  {
    label: 'Users',
    title: 'Manage',
    href: '/users',
    icon: <Iconify width={22} icon="solar:user-bold-duotone" />,
  },
  {
    label: 'Roles',
    title: 'Manage',
    href: '/roles',
    icon: <Iconify width={22} icon="solar:medal-star-circle-bold-duotone" />,
  },
  {
    label: 'Logs',
    title: 'Manage',
    href: '/logs',
    icon: <Iconify width={22} icon="solar:document-add-bold-duotone" />,
  },
  {
    label: 'Settings',
    title: 'Manage',
    href: '/settings',
    icon: <Iconify width={22} icon="solar:settings-bold-duotone" />,
  },
];
