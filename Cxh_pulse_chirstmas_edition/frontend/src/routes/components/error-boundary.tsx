import type { Theme, CSSObject } from '@mui/material/styles';

import { useRouteError, isRouteErrorResponse } from 'react-router';

import GlobalStyles from '@mui/material/GlobalStyles';

// ----------------------------------------------------------------------

/**
 * ErrorBoundary - Application-wide Error Handler
 * 
 * Catches and displays errors that occur during routing
 * 
 * Displays:
 * - HTTP errors (404, 500, etc.) with status code and message
 * - JavaScript errors with stack trace
 * - File path and function name where error occurred
 * 
 * This component is used as the errorElement in the router configuration
 * and catches all routing and rendering errors
 */
export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <>
      {/* Apply global styles for error page */}
      {inputGlobalStyles()}

      <div className={errorBoundaryClasses.root}>
        <div className={errorBoundaryClasses.container}>
          {/* Render appropriate error message based on error type */}
          {renderErrorMessage(error)}
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------

/**
 * Parses error stack trace to extract file path and function name
 * 
 * Useful for debugging by showing exactly where the error occurred
 * 
 * @param stack - Error stack trace string
 * @returns Object containing filePath and functionName (or null if not found)
 */
function parseStackTrace(stack?: string) {
  if (!stack) return { filePath: null, functionName: null };

  // Extract file path (matches /src/... pattern)
  const filePathMatch = stack.match(/\/src\/[^?]+/);
  // Extract function name (matches "at functionName" pattern)
  const functionNameMatch = stack.match(/at (\S+)/);

  return {
    filePath: filePathMatch ? filePathMatch[0] : null,
    functionName: functionNameMatch ? functionNameMatch[1] : null,
  };
}

/**
 * Renders appropriate error message based on error type
 * 
 * Handles three cases:
 * 1. Route errors (404, 500, etc.) - Shows status code and message
 * 2. JavaScript errors - Shows error name, message, and stack trace
 * 3. Unknown errors - Shows generic message
 * 
 * @param error - Error object from useRouteError()
 * @returns JSX element with formatted error message
 */
function renderErrorMessage(error: any) {
  // Handle HTTP/Route errors (404, 500, etc.)
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1 className={errorBoundaryClasses.title}>
          {error.status}: {error.statusText}
        </h1>
        <p className={errorBoundaryClasses.message}>{error.data}</p>
      </>
    );
  }

  // Handle JavaScript errors
  if (error instanceof Error) {
    const { filePath, functionName } = parseStackTrace(error.stack);

    return (
      <>
        <h1 className={errorBoundaryClasses.title}>Unexpected Application Error!</h1>
        <p className={errorBoundaryClasses.message}>
          {error.name}: {error.message}
        </p>
        {/* Show full stack trace for debugging */}
        <pre className={errorBoundaryClasses.details}>{error.stack}</pre>
        {/* Show file path and function name if available */}
        {(filePath || functionName) && (
          <p className={errorBoundaryClasses.filePath}>
            {filePath} ({functionName})
          </p>
        )}
      </>
    );
  }

  // Handle unknown error types
  return <h1 className={errorBoundaryClasses.title}>Unknown Error</h1>;
}

// ----------------------------------------------------------------------

const errorBoundaryClasses = {
  root: 'error-boundary-root',
  container: 'error-boundary-container',
  title: 'error-boundary-title',
  details: 'error-boundary-details',
  message: 'error-boundary-message',
  filePath: 'error-boundary-file-path',
};

const cssVars: CSSObject = {
  '--info-color': '#2dd9da',
  '--warning-color': '#e2aa53',
  '--error-color': '#ff5555',
  '--error-background': '#2a1e1e',
  '--details-background': '#111111',
  '--root-background': '#2c2c2e',
  '--container-background': '#1c1c1e',
  '--font-stack-monospace':
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  '--font-stack-sans':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
};

const rootStyles = (): CSSObject => ({
  display: 'flex',
  flex: '1 1 auto',
  alignItems: 'center',
  padding: '10vh 15px 0',
  flexDirection: 'column',
  fontFamily: 'var(--font-stack-sans)',
});

const contentStyles = (): CSSObject => ({
  gap: 24,
  padding: 20,
  width: '100%',
  maxWidth: 960,
  display: 'flex',
  borderRadius: 8,
  flexDirection: 'column',
  backgroundColor: 'var(--container-background)',
});

const titleStyles = (theme: Theme): CSSObject => ({
  margin: 0,
  lineHeight: 1.2,
  fontSize: theme.typography.pxToRem(20),
  fontWeight: theme.typography.fontWeightBold,
});

const messageStyles = (theme: Theme): CSSObject => ({
  margin: 0,
  lineHeight: 1.5,
  padding: '12px 16px',
  whiteSpace: 'pre-wrap',
  color: 'var(--error-color)',
  fontSize: theme.typography.pxToRem(14),
  fontFamily: 'var(--font-stack-monospace)',
  backgroundColor: 'var(--error-background)',
  borderLeft: '2px solid var(--error-color)',
  fontWeight: theme.typography.fontWeightBold,
});

const detailsStyles = (): CSSObject => ({
  margin: 0,
  padding: 16,
  lineHeight: 1.5,
  overflow: 'auto',
  borderRadius: 'inherit',
  color: 'var(--warning-color)',
  backgroundColor: 'var(--details-background)',
});

const filePathStyles = (): CSSObject => ({
  marginTop: 0,
  color: 'var(--info-color)',
});

const inputGlobalStyles = () => (
  <GlobalStyles
    styles={(theme) => ({
      body: {
        ...cssVars,
        margin: 0,
        color: 'white',
        backgroundColor: 'var(--root-background)',
        [`& .${errorBoundaryClasses.root}`]: rootStyles(),
        [`& .${errorBoundaryClasses.container}`]: contentStyles(),
        [`& .${errorBoundaryClasses.title}`]: titleStyles(theme),
        [`& .${errorBoundaryClasses.message}`]: messageStyles(theme),
        [`& .${errorBoundaryClasses.filePath}`]: filePathStyles(),
        [`& .${errorBoundaryClasses.details}`]: detailsStyles(),
      },
    })}
  />
);
