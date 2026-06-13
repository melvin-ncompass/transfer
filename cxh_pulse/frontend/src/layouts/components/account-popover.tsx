import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useRouter, usePathname } from '../../routes/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useLogoutMutation, useGetAvatarQuery } from '../../api';
import { logout as logoutAction, selectNavigation } from '../../store/slices/authSlice';
import { Permission } from '../../types/permissions';
import { useAppDispatch } from '../../store/hooks';
import { delay } from 'lodash';
import { useFilteredNav } from '../../hooks';
import { ListSubheader, Tooltip, Typography } from '@mui/material';
import { UserInfoDisplay } from './user-info-display';
import { accountPopoverStyles } from '../../styles/layouts/account-popover.styles';
import { getAuthUrl } from '../../routes/utils/auth-urls';
import { AuthTab } from '../../sections/landing/types';

// import { _myAccount } from 'src/_mock';

interface MenuOption {
  label: string;
  href: string;
  icon?: React.ReactNode;
  title?: string;
}
// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
    title?: string;
    allowedPermissions?: Permission[];
  }[];
};

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();
  const { data: avatar } = useGetAvatarQuery();

  const pathname = usePathname();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth as any);
  const navigation = useSelector(selectNavigation);
  // const filteredNav = useFilteredNav(data);

  // console.log(user);

  // Filter menu items based on user's navigation data
  const filteredData = data.filter((item) => {
    // If navigation data is not loaded yet, show all items
    if (!navigation || navigation.length === 0) {
      return true;
    }
    // Check if the item's path exists in user's navigation
    return navigation.some((navItem) => navItem.path === item.href);
  });

  // console.log(user);

  //grouping data for user-management section in popover
  const groupedData = filteredData.reduce<Record<string, MenuOption[]>>((acc, item) => {
    const group = item.title || 'ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleLogoutClick = useCallback(
    async (path: string) => {
      try {
        await logoutMutation().unwrap();
      } catch (error) {
        console.error('Logout API failed:', error);
        // Continue with client-side logout even if API fails
      } finally {
        // Clear Redux state
        dispatch(logoutAction());
        // Trigger cross-tab logout sync
        localStorage.setItem('logout', Date.now().toString());
        handleClosePopover();
        delay(() => {
          router.push(path);
        }, 100);
      }
    },
    [handleClosePopover, router, logoutMutation, dispatch]
  );

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={[
          accountPopoverStyles.iconButton,
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Avatar
          src={avatar || user?.userInfo?.avatar || '/assets/images/avatar/avatar-25.webp'}
          alt={user?.userInfo?.name || 'User'}
          sx={{ width: 1, height: 1 }}
        >
          {user?.userInfo?.name?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: accountPopoverStyles.popoverPaper,
          },
        }}
      >
        <Box sx={accountPopoverStyles.userInfoContainer}>
          <UserInfoDisplay />
        </Box>

        {filteredData.length > 0 && <Divider sx={accountPopoverStyles.divider} />}

        <>
          {Object.entries(groupedData).map(([title, items]) => (
            <MenuList
              key={title}
              disablePadding
              subheader={
                title !== 'ungrouped' ? (
                  <ListSubheader
                    disableSticky
                    sx={accountPopoverStyles.listSubheader}
                  >
                    {title}
                  </ListSubheader>
                ) : null
              }
              sx={[
                ...(Array.isArray(accountPopoverStyles.menuList) ? accountPopoverStyles.menuList : [accountPopoverStyles.menuList]),
                {
                  [`& .${menuItemClasses.root}`]: {
                    px: 1,
                    gap: 2,
                    borderRadius: 0.75,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    [`&.${menuItemClasses.selected}`]: {
                      color: 'text.primary',
                      bgcolor: 'action.selected',
                      fontWeight: 'fontWeightSemiBold',
                    },
                  },
                },
              ]}
            >
              {items.map((option) => (
                <MenuItem
                  key={option.label}
                  role="menuitem"
                  tabIndex={0}
                  selected={option.href === pathname}
                  onClick={() => handleClickItem(option.href)}
                  sx={accountPopoverStyles.menuItem(option.title === 'Manage' ? '18px !important' : undefined)}
                >
                  {option.icon}
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          ))}
        </>

        {filteredData.length > 0 && <Divider sx={accountPopoverStyles.dividerDashed} />}

        <Box sx={accountPopoverStyles.logoutContainer}>
          <Button
            fullWidth
            color="error"
            size="medium"
            variant="text"
            onClick={() => handleLogoutClick(getAuthUrl(AuthTab.SIGN_IN))}
          >
            Logout
          </Button>
        </Box>
      </Popover>
    </>
  );
}
