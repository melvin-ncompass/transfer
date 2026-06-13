// material-ui
import type { TypographyVariantsOptions } from "@mui/material/styles";

export default function Typography(): TypographyVariantsOptions {
  const fontFamily = "'Droid Sans', 'Helvetica Neue', sans-serif";
  return {
    fontFamily,
    h6: {
      fontWeight: 700,
      fontSize: "1.2rem",
      lineHeight: 1.56,
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.25rem",
      lineHeight: 1.5,
      "@media (min-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: 1.5,
      "@media (min-width:600px)": {
        fontSize: "1.75rem",
      },
      "@media (min-width:900px)": {
        fontSize: "2rem",
      },
    },
    h3: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.5,
      "@media (min-width:600px)": {
        fontSize: "2.25rem",
      },
      "@media (min-width:900px)": {
        fontSize: "2.5rem",
      },
      "@media (min-width:1200px)": {
        fontSize: "3rem",
      },
    },
    h2: {
      fontWeight: 800,
      fontSize: "2.5rem",
      lineHeight: 1.25,
      "@media (min-width:600px)": {
        fontSize: "3rem",
      },
      "@media (min-width:900px)": {
        fontSize: "3.5rem",
      },
      "@media (min-width:1200px)": {
        fontSize: "4rem",
      },
    },
    h1: {
      fontWeight: 800,
      fontSize: "3.5rem",
      lineHeight: 1.21,
      "@media (min-width:600px)": {
        fontSize: "4rem",
      },
      "@media (min-width:900px)": {
        fontSize: "4.5rem",
      },
      "@media (min-width:1200px)": {
        fontSize: "5rem",
      },
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    subtitle2: {
      fontSize: '0.9rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.9rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      textTransform: "capitalize",
    },
    overline: {
      fontSize: "0.85rem",
      fontWeight: 600,
      lineHeight: 1.4,
      textTransform: "uppercase",
    },
  };
}
