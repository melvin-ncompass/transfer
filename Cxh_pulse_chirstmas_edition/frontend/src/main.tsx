import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';

import App from './app';
import { routesSection } from './routes/routes';
import { ErrorBoundary } from './routes/components';

// ----------------------------------------------------------------------

/**
 * Main router configuration for the application
 * 
 * Structure:
 * - Root route wraps everything with the App component
 * - ErrorBoundary catches and displays routing errors
 * - All routes defined in routesSection are nested as children
 * - Outlet renders the matched child route
 */
const router = createBrowserRouter([
  {
    Component: () => (
      <App>
        <Outlet /> {/* Renders the currently matched route */}
      </App>
    ),
    errorElement: <ErrorBoundary />, // Catches errors in routing
    children: routesSection, // All application routes
  },
]);

/**
 * Application entry point
 * 
 * Creates the React root and renders the application
 * StrictMode helps identify potential problems by:
 * - Detecting unexpected side effects
 * - Warning about deprecated APIs
 * - Ensuring components are resilient to being mounted/unmounted
 */
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
