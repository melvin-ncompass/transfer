import './global.css';

import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { usePathname } from './routes/hooks';

import { store } from './store/store';
import { ThemeProvider } from './theme/theme-provider';
import { SnackbarProvider } from 'notistack';
import { BrandingProvider } from './contexts/branding-context';
// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

/**
 * Root application component that wraps the entire app with necessary providers
 * 
 * Provider hierarchy (outer to inner):
 * 1. Redux Provider - Global state management
 * 2. BrandingProvider - Branding configuration (colors, logo, etc.)
 * 3. ThemeProvider - Material-UI theme configuration (depends on BrandingProvider)
 * 4. SnackbarProvider - Global notification system (max 3 snackbars at once)
 * 
 * Also handles automatic scroll-to-top on route changes
 * 
 * @param children - Child components (typically the router outlet)
 */
export default function App({ children }: AppProps) {
  // Scroll to top whenever the route changes
  useScrollToTop();

  return (
    <Provider store={store}>
      <BrandingProvider>
        <ThemeProvider>
          <SnackbarProvider maxSnack={3}>
              {children}
          </SnackbarProvider>
        </ThemeProvider>
      </BrandingProvider>
    </Provider>
  );
}

// ----------------------------------------------------------------------

/**
 * Custom hook that scrolls the window to the top whenever the route changes
 * 
 * This ensures users always start at the top of a new page when navigating,
 * providing a better user experience similar to traditional page loads
 */
function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top-left corner of the page
    window.scrollTo(0, 0);
  }, [pathname]); // Re-run when pathname changes

  return null;
}
