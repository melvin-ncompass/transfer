// src/theme/theme-provider.tsx
import type { ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';
import { generateTheme } from './generateTheme';
import { createTheme  } from './create-theme';
import { useBranding } from "../contexts/branding-context";
import type { ThemeOptions } from './types';

export type ThemeProviderProps = Partial<MuiThemeProviderProps> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const { branding, loading } = useBranding();

  if (loading) {
    // Return the base theme while loading
    const theme = createTheme({ themeOverrides });
    return (
      <ThemeVarsProvider theme={theme} {...other}>
        <CssBaseline />
        {children}
      </ThemeVarsProvider>
    );
  }

  // Generate theme with branding when available
  const theme = generateTheme(branding);
  if (themeOverrides) {
    Object.assign(theme, themeOverrides);
  }

  return (
    <ThemeVarsProvider theme={theme} {...other}>
      <CssBaseline />
      {children}
    </ThemeVarsProvider>
  );
}