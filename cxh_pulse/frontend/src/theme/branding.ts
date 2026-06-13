export interface Branding {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  logo: {
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
  };
  typography?: {
    fontFamily?: string;
  };
}