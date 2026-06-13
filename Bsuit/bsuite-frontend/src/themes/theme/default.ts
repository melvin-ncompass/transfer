import type { ColorProps } from "../../types/types";

//  DEFAULT THEME COLORS  //

const defaultColor: ColorProps = {
  // paper & background
  paper: '#ffffff',
  background: '#fafafa',

  // primary
  primaryLight: '#dfe9f7',
  primaryMain: '#1976d2',
  primaryDark: '#2d4da4',
  primary200: '#bbd4f5',
  primary800: '#0d3a75',
  primaryContrastText: '#ffffff',

  // secondary
  secondaryLight: '#eeeff1',
  secondaryMain: '#9FA6B2',
  secondaryDark: '#5c6167db',
  secondary200: '#cfd4db',
  secondary800: '#3a3f45',
  secondaryContrastText: '#ffffffff',

  // success
  successLight: '#e0f5e5',
  successMain: '#14A44D',
  successDark: '#2d8d59',
  success200: '#a1d9a4',
  successContrastText: '#ffffff',

  // error
  errorLight: '#fde5df',
  errorMain: '#DC4C64',
  errorDark: '#b4342d',
  errorContrastText: '#ffffff',

  // warning
  warningLight: '#fef2dc',
  warningMain: '#E4A11B',
  warningDark: '#b3731a',
  warningContrastText: '#616161',

  // info
  infoLight: '#e0f3f9',
  infoMain: '#54B4D3',
  infoDark: '#3c7ca6',
  infoContrastText: '#ffffff',

  // row highlight (visible success feedback on white table background)
  rowHighlight: '#b7f5cc',

  // grey
  grey50: '#f5f5f5',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  // text variants
  textPrimary: '#212121',
  textSecondary: '#464646ff',

  //  DARK THEME VARIANTS //

  // paper & background
  darkPaper: '#111936',
  darkBackground: '#1a223f',

  // dark 800 & 900
  darkLevel1: '#29314f',
  darkLevel2: '#212946',

  // text variants
  darkTextTitle: '#d7dcec',
  darkTextPrimary: '#bdc8f0',
  darkTextSecondary: '#8492c4',

  // primary dark
  darkPrimaryLight: '#dfe9f7',
  darkPrimaryMain: '#1976d2',
  darkPrimaryDark: '#2d4da4',

  // secondary dark
  darkSecondaryLight: '#eeeff1',
  darkSecondaryMain: '#9FA6B2',
  darkSecondaryDark: '#5c6167db',
};

export default defaultColor;