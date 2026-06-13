import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import { AuthLayout } from '../layouts/auth';
import { DashboardLayout } from '../layouts/dashboard';
import { PermissionGuard, NavigationGuard } from './components';
import { lazyScaffoldingImport } from './utils/conditional-import';
import { DashboardPermissions, PermissionName } from '../types/permissions';
import LandingPage from '../pages/landing';
import GetStartedPage from '../pages/get-started';
import LandingAboutSectionPage from '../pages/landing-about-section';
import { routesStyles } from '../styles/routes';
import RegisterPage from '@/sections/landing/components/sign-up';
import LoginPage from '@/sections/landing/components/sign-in';

// ----------------------------------------------------------------------

// Dashboard pages - conditionally imported from scaffolding
export const UserPage = lazyScaffoldingImport('/scaffolding/pages/user');
export const RolePage = lazyScaffoldingImport('/scaffolding/pages/role');
export const SessionPage = lazyScaffoldingImport('/scaffolding/pages/session');
export const ProfilePage = lazyScaffoldingImport('/scaffolding/pages/profile');
export const SettingsPage = lazyScaffoldingImport('/scaffolding/pages/settings');
export const StyleGuidePage = lazyScaffoldingImport('/scaffolding/pages/style-guide');
// Auth pages - conditionally imported from scaffolding
export const ForgotPasswordPage = lazyScaffoldingImport('/scaffolding/pages/forgot-password');
export const ResetPasswordPage = lazyScaffoldingImport('/scaffolding/pages/reset-password');
export const Page404 = lazyScaffoldingImport('/scaffolding/pages/page-not-found');
export const SignInPage = lazyScaffoldingImport('/scaffolding/pages/sign-in');
export const SignUpPage = lazyScaffoldingImport('/scaffolding/pages/sign-up');

// Accept invite/request pages - conditionally imported from scaffolding
export const AcceptInvitePage = lazyScaffoldingImport('/scaffolding/pages/accept-invite');
export const AcceptRequestPage = lazyScaffoldingImport('/scaffolding/pages/accept-request');
export const AccessDeniedPage = lazyScaffoldingImport('/scaffolding/pages/access-denied');

// Insights pages
export const HomePage = lazy(() => import('../pages/home'));
export const DashboardPage = lazy(() => import('../pages/dashboard'));
export const DataTablePage = lazy(() => import('../pages/datatable'));
export const ConfigPage = lazy(() => import('../pages/config'));
export const HelpPage = lazy(() => import('../pages/help'));

const renderFallback = () => (
  <Box sx={routesStyles.fallbackContainer}>
    <LinearProgress sx={routesStyles.fallbackProgress} />
  </Box>
);

// Check if we're in development/local environment

export const routesSection: RouteObject[] = [
  // Main Dashboard Routes
  // landing page - accessible to both authenticated and unauthenticated users
  { index: true, element: <LandingPage /> },
  // Get Started page
  { path: 'get-started', element: <GetStartedPage /> },
  // About page (landing about section)
  { path: 'about', element: <LandingAboutSectionPage /> },
  // Login page
  {
    path: 'login',
    element: (
      <Suspense fallback={renderFallback()}>
        <LoginPage />
      </Suspense>
    ),
  },
  // Register page
  {
    path: 'register',
    element: (
      <Suspense fallback={renderFallback()}>
        <RegisterPage />
      </Suspense>
    ),
  },
  // dashboard routes
  {
    element: (
      <DashboardLayout>
        <Suspense fallback={renderFallback()}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    ),
    children: [
      // Home page - redirects to first accessible page based on permissions
      { index: true, element: <HomePage /> },
      // Dashboard - points to insights page (current insights functionality)
      {
        path: 'dashboard',
        element:
          <PermissionGuard anyPermission={DashboardPermissions} showAccessDenied>
            <DashboardPage />
          </PermissionGuard>
        ,
      },
      // DataTable page
      {
        path: 'datatable',
        element:
          <PermissionGuard permission={PermissionName.DATA} showAccessDenied>
            <DataTablePage />
          </PermissionGuard>
      },
      // Config page
      {
        path: 'config',
        element:
          <PermissionGuard permission={PermissionName.CONFIG} showAccessDenied>
            <ConfigPage />
          </PermissionGuard>
      },
      // Help page
      {
        path: 'help',
        element:
          <PermissionGuard permission={PermissionName.HELP} showAccessDenied>
            <HelpPage />
          </PermissionGuard>
      },
      {
        path: 'users',
        element: (
          <NavigationGuard path="/users">
            <UserPage />
          </NavigationGuard>
        ),
      },
      {
        path: 'roles',
        element: (
          <NavigationGuard path="/roles">
            <RolePage />
          </NavigationGuard>
        ),
      },
      {
        path: 'logs',
        element: (
          <NavigationGuard path="/logs">
            <SessionPage />
          </NavigationGuard>
        ),
      },
      {
        path: 'profile',
        element: (
          <NavigationGuard path="/profile">
            <ProfilePage />
          </NavigationGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <NavigationGuard path="/settings">
            <SettingsPage />
          </NavigationGuard>
        ),
      },

      // Style guide - only accessible in local environment

      {
        path: 'style-guide',
        element: <StyleGuidePage />,
      },
    ],
  },
  {
    path: 'user/invite',
    element: (
      <AuthLayout>
        <AcceptInvitePage />
      </AuthLayout>
    ),
  },
  {
    path: 'user/request',
    element: (
      <AuthLayout>
        <AcceptRequestPage />
      </AuthLayout>
    ),
  },
  {
    path: 'forgot-password',
    element: (
      <AuthLayout>
        <ForgotPasswordPage />
      </AuthLayout>
    ),
  },
  {
    path: 'user/resetpassword',
    element: (
      <AuthLayout>
        <ResetPasswordPage />
      </AuthLayout>
    ),
  },
  {
    path: 'access-denied',
    element: <AccessDeniedPage />,
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];

