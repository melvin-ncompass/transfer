import '@mui/material/styles';
declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      z1: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
      [key: string]: string; // optional: allows other keys
    };
    padding: string;
  }
  interface ThemeOptions {
    customShadows?: {
      z1?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
      primary?: string;
      secondary?: string;
      success?: string;
      warning?: string;
      error?: string;
      [key: string]: string; // optional
    };
    padding?: string;
  }
  interface Typography {
    commonAvatar: React.CSSProperties;
    mediumAvatar: React.CSSProperties;
  }
  interface TypographyOptions {
    commonAvatar?: React.CSSProperties;
    mediumAvatar?: React.CSSProperties;
  }
}
