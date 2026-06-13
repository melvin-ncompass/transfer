import { useMemo, type ReactNode } from 'react';
import {
  createTheme,
  type ThemeOptions,
  ThemeProvider,
  type Theme,
  type TypographyVariantsOptions
} from '@mui/material/styles';
import { StyledEngineProvider, CssBaseline } from '@mui/material';

// project imports
import CustomShadows from './customShadows';
import useConfig from '../hooks/useConfig';
import { buildPalette } from './palette';
import Typography from './typography';
import componentsOverrides from './overrides';

interface Props {
  children: ReactNode;
}

//  LIGHT THEME - MAIN //

export default function ThemeCustomization({ children }: Props): React.JSX.Element {
  // only presetColor now comes from config
  const {
    state: { presetColor }
  } = useConfig();

  // Build the light palette only
  const palette = useMemo(() => buildPalette(presetColor), [presetColor]);

  // Build typography config (no params needed)
  const themeTypography: TypographyVariantsOptions = useMemo(() => Typography(), []);

  // Core theme options (light only)
  const themeOptions: ThemeOptions = useMemo(
    () => ({
      palette,
      typography: themeTypography,
      shape: {
        borderRadius: 8, // centralized border radius
      },
      padding: '20px',
      mixins: {
        toolbar: {
          minHeight: '48px',
          padding: '16px',
          '@media (min-width: 600px)': {
            minHeight: '48px'
          }
        }
      },
      customShadows: CustomShadows(palette)
    }),
    [themeTypography, palette]
  );

  // Create the final theme
  const theme: Theme = createTheme(themeOptions);

  // Apply component overrides
  theme.components = useMemo(
    () => componentsOverrides(theme, 8, false), // hardcoded: borderRadius=8, outlinedFilled=false (transparent background)
    [theme]
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
