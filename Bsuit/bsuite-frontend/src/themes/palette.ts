// material-ui
import type { PaletteMode, PaletteOptions } from '@mui/material/styles';

// project imports
import { extendPaletteWithChannels } from '../utils/colorUtils';

// assets (color sets)
import defaultColor from './theme/default';
import theme1 from './theme/theme1';
import theme2 from './theme/theme2';
import theme3 from './theme/theme3';
import theme4 from './theme/theme4';
import theme5 from './theme/theme5';
import theme6 from './theme/theme6';

// types
import type { ColorProps, PresetColor } from '../types/types';

//  LIGHT THEME - PALETTE  //

export function buildPalette(presetColor: PresetColor): PaletteOptions {
  let colors: ColorProps;

  switch (presetColor) {
    case 'theme1':
      colors = theme1;
      break;
    case 'theme2':
      colors = theme2;
      break;
    case 'theme3':
      colors = theme3;
      break;
    case 'theme4':
      colors = theme4;
      break;
    case 'theme5':
      colors = theme5;
      break;
    case 'theme6':
      colors = theme6;
      break;
    case 'default':
    default:
      colors = defaultColor;
  }

  // Light mode palette only
  const lightColors = {
    primary: {
      light: colors.primaryLight,
      main: colors.primaryMain,
      dark: colors.primaryDark,
      200: colors.primary200,
      800: colors.primary800,
      contrastText: colors.primaryContrastText,
    },
    secondary: {
      light: colors.secondaryLight,
      main: colors.secondaryMain,
      dark: colors.secondaryDark,
      200: colors.secondary200,
      800: colors.secondary800,
      contrastText: colors.secondaryContrastText,  // Fixed: use secondary's own
    },
    error: {
      light: colors.errorLight,
      main: colors.errorMain,
      dark: colors.errorDark,
      contrastText: colors.errorContrastText,     // Fixed: use error's own
    },
    info: {
      light: colors.infoLight,
      main: colors.infoMain,
      dark: colors.infoDark,
      contrastText: colors.infoContrastText,      // Fixed: use info's own
    },
    warning: {
      light: colors.warningLight,
      main: colors.warningMain,
      dark: colors.warningDark,
      contrastText: colors.warningContrastText,   // Fixed: use warning's own
    },
    success: {
      light: colors.successLight,
      200: colors.success200,
      main: colors.successMain,
      dark: colors.successDark,
      contrastText: colors.successContrastText,   // Fixed: use success's own
    },
    grey: {
      50: colors.grey50,
      100: colors.grey100,
      500: colors.grey500,
      600: colors.grey600,
      700: colors.grey700,
      900: colors.grey900
    },
    dark: {
      light: colors.darkTextPrimary,
      main: colors.darkLevel1,
      dark: colors.darkLevel2,
      800: colors.darkBackground,
      900: colors.darkPaper
    },
    // border color
    divider: colors.grey300,
    background: {
      paper: colors.paper,
      default: colors.paper
    },
    // row highlight (e.g. table row after add/edit)
    rowHighlight: colors.rowHighlight
  };


  const commonColor = {
    common: { black: colors.darkPaper, white: '#fff' }
  };

  const extendedLight = extendPaletteWithChannels(lightColors);
  const extendedCommon = extendPaletteWithChannels(commonColor);

  // Return a single palette object
  return {
    mode: 'light' as PaletteMode,
    ...extendedCommon,
    ...extendedLight
  };
}
