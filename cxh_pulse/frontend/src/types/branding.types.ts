export interface Branding {
  // API fields
  id?: string;
  fgcolor?: string;
  bgcolor?: string;
  logo?: string; // Raw logo string from API
  
  // Mapped fields
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  logoData: {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
  };
  typography?: {
    fontFamily?: string;
  };
}