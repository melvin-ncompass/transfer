import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectNavigation } from '../../store/slices/authSlice';

interface NavigationGuardProps {
  path: string;
  children: React.ReactNode;
}

/**
 * NavigationGuard - Protects routes based on user's allowed navigation paths
 * Checks if the current path is in the user's navigation data from the API
 * Redirects to /access-denied if user doesn't have access
 */
export function NavigationGuard({ path, children }: NavigationGuardProps) {
  const navigation = useSelector(selectNavigation);

  // If navigation data is not loaded yet, allow access (will be handled by auth guard)
  if (!navigation || navigation.length === 0) {
    return <>{children}</>;
  }

  // Check if the user has access to this path
  const hasAccess = navigation.some((navItem) => navItem.path === path);

  if (!hasAccess) {
    // Redirect to access denied page
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
