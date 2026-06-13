import type { CommonColors } from '@mui/material/styles';

import type { ThemeCssVariables } from './types';
import { type PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

type TypographyVariant = {
  fontWeight: number;
  fontSize: string;
  lineHeight: number;
  '@media (min-width:600px)'?: { fontSize: string };
  '@media (min-width:900px)'?: { fontSize: string };
  '@media (min-width:1200px)'?: { fontSize: string };
};

type ThemeConfig = {
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  fontFamily: Record<'primary' | 'secondary', string>;
  typography: {
    h1: TypographyVariant;
    h2: TypographyVariant;
    h3: TypographyVariant;
    h4: TypographyVariant;
    h5: TypographyVariant;
    h6: TypographyVariant;
  };
  palette: Record<
    'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error',
    PaletteColorNoChannels
  > & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: Record<
      '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
      string
    >;
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  classesPrefix: 'minimal',
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'DM Sans Variable',
    secondary: 'Barlow',
  },
  typography: {
    h1: {
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.21,
      '@media (min-width:600px)': {
        fontSize: '4rem',
      },
      '@media (min-width:900px)': {
        fontSize: '4.5rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '5rem',
      },
    },
    h2: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.25,
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
      '@media (min-width:900px)': {
        fontSize: '3.5rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '4rem',
      },
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '2.25rem',
      },
      '@media (min-width:900px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '3rem',
      },
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:900px)': {
        fontSize: '2rem',
      },
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.56,
    },
  },
  palette: {

    primary: {
      light: '#64B5F6',
      main: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
      lighter: '#c3dce2', // Using the same as light variant for consistency
      darker: '#0D47A1',
    },
    secondary: {
      lighter: '#BBDEFB',
      light: '#64B5F6',
      main: '#1565C0',
      dark: '#0D47A1',
      darker: '#01579B',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#CAFDF5',
      light: '#61F3F3',
      main: '#00B8D9',
      dark: '#006C9C',
      darker: '#003768',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#D3FCD2',
      light: '#77ED8B',
      main: '#22C55E',
      dark: '#118D57',
      darker: '#065E49',
      contrastText: '#ffffff',
    },
    warning: {
      // Using direct RGBA value for the lighter variant
      lighter: '#1976d2',
      light: '#FFD666',
      main: '#FFAB00',
      dark: '#B76E00',
      darker: '#7A4100',
      contrastText: '#1C252E',
    },
    error: {
      lighter: '#FFE9D5',
      light: '#FFAC82',
      main: '#FF5630',
      dark: '#B71D18',
      darker: '#7A0916',
      contrastText: '#FFFFFF',
    },
    grey: {
      '50': '#FCFDFD',
      '100': '#F9FAFB',
      '200': '#F4F6F8',
      '300': '#DFE3E8',
      '400': '#C4CDD5',
      '500': '#919EAB',
      '600': '#637381',
      '700': '#454F5B',
      '800': '#1C252E',
      '900': '#141A21',
    },
    common: { black: '#000000', white: '#FFFFFF' },
  },
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
};
