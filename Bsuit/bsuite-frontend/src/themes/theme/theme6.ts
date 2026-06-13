import type { ColorProps } from "../../types/types";

//  THEME 6 COLORS  //

const theme6: ColorProps = {
  // paper & background
  paper: "#ffffff",

// Primary – Indigo
primaryLight: "#C7D2FE",
primary200: "#A5B4FC",
primaryMain: "#6366F1",
primaryDark: "#4338CA",
primary800: "#312E81",
primaryContrastText: "#FFFFFF",

// Secondary – Lavender Grey
secondaryLight: "#F1F0F7",
secondary200: "#DDD9EA",
secondaryMain: "#C4BDD9",
secondaryDark: "#A79DBF",
secondary800: "#7E739A",
secondaryContrastText: "#1F1F1F",

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

  // info
  infoLight: "#e0f3f9",
  infoMain: "#54B4D3",
  infoDark: "#3c7ca6",
  infoContrastText: "#ffffff",

  // warning
  warningLight: "#fff8e1",
  warningMain: "#ffe57f",
  warningDark: "#ffc107",
  warningContrastText: "#000000",

  // row highlight (slightly richer green since primary is already green — keeps it distinct)
  rowHighlight: '#a3efbe',

  // grey
  grey50: "#f8fafc",
  grey100: "#eef2f6",
  grey200: "#e3e8ef",
  grey300: "#cdd5df",
  grey500: "#697586",
  grey600: "#4b5565",
  grey700: "#364152",
  grey900: "#121926",

  // DARK THEME VARIANTS //

  // paper & background
  darkPaper: "#111936",
  darkBackground: "#1a223f",

  // dark 800 & 900
  darkLevel1: "#29314f",
  darkLevel2: "#212946",

  // text variants
  darkTextTitle: "#d7dcec",
  darkTextPrimary: "#bdc8f0",
  darkTextSecondary: "#8492c4",

  // primary dark
  darkPrimaryLight: "#eeedfd",
  darkPrimaryMain: "#7267ef",
  darkPrimaryDark: "#6a5fed",
  darkPrimary200: "#b9b3f7",
  darkPrimary800: "#554ae8",

  // secondary dark
  darkSecondaryLight: "#eeedfd",
  darkSecondaryMain: "#7267ef",
  darkSecondaryDark: "#6a5fed",
  darkSecondary200: "#b9b3f7",
  darkSecondary800: "#554ae8",
};

export default theme6;