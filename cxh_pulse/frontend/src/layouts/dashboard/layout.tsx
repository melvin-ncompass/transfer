import type { Breakpoint } from '@mui/material/styles';

import { useMemo, useEffect, useState } from 'react';
import { merge } from 'es-toolkit';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { Button, useMediaQuery, CircularProgress } from '@mui/material';

import type { AppDispatch, RootState } from '../../store/store';
import { useRefreshTokenMutation, useLazyGetCurrentUserQuery } from '../../api';
import { Logo } from '../../components/logo';
import { layoutClasses } from '../core/classes';
import { _account } from '../nav-config-account';
import { dashboardLayoutVars } from './css-vars';
import { navData, convertApiNavigationToNavData } from '../nav-config-dashboard';
import { MainSection } from '../core/main-section';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { AccountPopover } from '../components/account-popover';
import { UserInfoDisplay } from '../components/user-info-display';
import { CXHNavMobile } from '../components/cxh-nav-mobile-drawer';
import CXHNavHeader from '../components/cxh-nav-header';
import { dashboardLayoutStyles } from '../../styles/layouts/dashboard-layout.styles';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';
import { setUser, setAccessToken, selectNavigation } from '../../store/slices/authSlice';
import { useSelector, useDispatch } from 'react-redux';
import { Iconify } from '../../components/iconify';
import { getAuthUrl, saveRedirectUrl } from '../../routes/utils/auth-urls';
import { AuthTab } from '../../sections/landing/types';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { value: isNavCollapsed, onToggle: onToggleNavCollapse } = useBoolean();
  const [refreshToken] = useRefreshTokenMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const userNavigation = useSelector((state: RootState) => state.auth.userNavigation);
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const apiNavigation = useSelector(selectNavigation);
  const isSmallScreen = useMediaQuery('(max-width: 790px)');
  const isMobileScreen = useMediaQuery('(max-width: 530px)');
  const [drawer, setDrawer] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setDrawer(newOpen);
  };

  // Use API navigation if available, otherwise fall back to static navData
  const navigationData = useMemo(() => {
    if (apiNavigation && apiNavigation.length > 0) {
      return convertApiNavigationToNavData(apiNavigation);
    }
    return navData;
  }, [apiNavigation]);

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
        sx: {
          py: 0.5,
        },
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={dashboardLayoutStyles.alert}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <Box sx={dashboardLayoutStyles.leftAreaContainer}>
          {isSmallScreen === true && (
            <Button onClick={toggleDrawer(true)} sx={dashboardLayoutStyles.menuButton}>
              <Iconify width={18} icon="custom:menu-duotone" />
            </Button>
          )}
          <CXHNavMobile drawer={drawer} toggleDrawer={toggleDrawer} />
          <Logo href={userNavigation} />

          {/* Top navigation bar with 4 items */}
          <Box sx={dashboardLayoutStyles.navContainer}>
            {isSmallScreen !== true && <CXHNavHeader />}
          </Box>
          {/** @slot Nav mobile */}
        </Box>
      ),
      rightArea: (
        <Box sx={dashboardLayoutStyles.rightAreaContainer}>
          {!isMobileScreen && <UserInfoDisplay />}
          {/** @slot Account drawer */}
          <AccountPopover data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection {...slotProps?.main}>
      {children}
    </MainSection>
  );

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken || (user && user.id !== '')) {
        return;
      }

      // Save redirect URL IMMEDIATELY before any async operations
      // This ensures it's saved even if the component unmounts or navigation happens quickly
      saveRedirectUrl(location.pathname, location.search);

      try {
        const { accessToken: newAccessToken } = await refreshToken().unwrap();

        dispatch(setAccessToken(newAccessToken));

        const currentUser = await getCurrentUser().unwrap();
        dispatch(setUser(currentUser));

        if (!currentUser) {
          navigate(getAuthUrl(AuthTab.SIGN_IN), { replace: true });
        }
      } catch (error: any) {
        // Check if it's a 500 error (backend issue) vs auth error
        const isServerError = error?.status === 500 || error?.status === 'FETCH_ERROR';

        if (isServerError) {
          // For server errors, log but don't redirect - app can work with limited functionality
          console.error('Server error fetching user data:', error);
          // Set user with empty permissions so app can still function
          dispatch(setUser({
            id: '',
            email: '',
            name: '',
            permissions: { system: [], business: [] },
            userInfo: { name: '', email: '' },
          }));
          navigate(getAuthUrl(AuthTab.SIGN_IN), { replace: true });
        } else {
          // For auth errors (401, 403), redirect to sign-in
          // Redirect URL is already saved above
          console.error('Authentication failed:', error);
          navigate(getAuthUrl(AuthTab.SIGN_IN), { replace: true });
        }
      }
    };

    initializeAuth();
  }, [dispatch, navigate, refreshToken, getCurrentUser, accessToken, user, location]);

  // Don't return null immediately - allow time for redirect URL to be saved
  // Show a loading state instead to prevent premature unmounting
  if (!accessToken) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme, isNavCollapsed), ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}
