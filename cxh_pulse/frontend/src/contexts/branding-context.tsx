// src/contexts/branding-context.tsx
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { Branding } from '../types';
import { useGetBrandingQuery } from '../api';
import { getContrastingTextColor, getContrastRatio } from '../utils/color';
import tinycolor from 'tinycolor2';

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const defaultBranding: Branding = {
  // API fields
  fgcolor: '#D32F2F',
  bgcolor: '#FFFFFF',
  logo: 'CxH pulse',

  // Mapped fields
  colors: {
    primary: '#D32F2F',
    secondary: '#D32F2F',
    background: '#FFFFFF',
    text: '#000000',
  },
  logoData: {
    src: '',
    alt: 'CxH pulse',
  },
  typography: {
    fontFamily: 'DM Sans Variable, Barlow, sans-serif',
  },
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  error: null,
  refresh: () => { },
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data: brandingData,
    isLoading,
    error: fetchError,
    refetch
  } = useGetBrandingQuery(undefined, {
    // Don't refetch on window focus to prevent UI flickering
    refetchOnFocus: false,
    // Don't refetch on reconnect to prevent UI flickering
    refetchOnReconnect: false,
    // Don't refetch on mount if we already have data
    refetchOnMountOrArgChange: false,
  });

  // Merge default branding with fetched branding
  const branding = useMemo(() => ({
    ...defaultBranding,
    // Map the API response to our branding structure
    fgcolor: brandingData?.fgcolor || defaultBranding.fgcolor,
    bgcolor: brandingData?.bgcolor || defaultBranding.bgcolor,
    logo: brandingData?.logo || defaultBranding.logo,
    colors: (() => {
      const bg = brandingData?.bgcolor || defaultBranding.bgcolor;
      const primary =
        brandingData?.colors?.primary || brandingData?.fgcolor || defaultBranding.colors.primary;
      const secondary = brandingData?.colors?.secondary || defaultBranding.colors.secondary;
      const text =
        brandingData?.colors?.text || getContrastingTextColor(bg as string) || brandingData?.fgcolor || defaultBranding.colors.text;
      return {
        ...defaultBranding.colors,
        primary,
        secondary,
        background: bg,
        text,
      } as Branding['colors'];
    })(),
    logoData: {
      ...defaultBranding.logoData,
      alt: brandingData?.logo || defaultBranding.logoData.alt,
    },
  }), [brandingData]);

  // Apply CSS variables so plain CSS and third-party components can pick up branding
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--brand-bg', branding.colors.background);
      root.style.setProperty('--brand-accent', branding.colors.primary);
      root.style.setProperty('--brand-accent-contrast', getContrastingTextColor(branding.colors.primary));
      root.style.setProperty('--brand-text', branding.colors.text);
      // secondary and other role colors (use defaults when not provided)
      root.style.setProperty('--brand-secondary', branding.colors.secondary || '#1565C0');
      root.style.setProperty('--brand-secondary-contrast', getContrastingTextColor(branding.colors.secondary || '#1565C0'));
      // sensible defaults for semantic colors
      root.style.setProperty('--brand-success', (branding as any).colors?.success || '#22C55E');
      root.style.setProperty('--brand-success-contrast', getContrastingTextColor((branding as any).colors?.success || '#22C55E'));
      root.style.setProperty('--brand-warning', (branding as any).colors?.warning || '#FFAB00');
      root.style.setProperty('--brand-warning-contrast', getContrastingTextColor((branding as any).colors?.warning || '#FFAB00'));
      root.style.setProperty('--brand-error', (branding as any).colors?.error || '#FF5630');
      root.style.setProperty('--brand-error-contrast', getContrastingTextColor((branding as any).colors?.error || '#FF5630'));
      // optional: provide explicit fg/bg shorthand
      root.style.setProperty('--brand-fg', branding.fgcolor || branding.colors.primary);

      // Compute a header surface that contrasts subtly with the page background
      const bg = tinycolor(branding.colors.background || '#ffffff');
      let headerSurface = '';
      if (bg.isDark()) {
        // for dark backgrounds, make header slightly lighter
        headerSurface = bg.clone().lighten(12).toHexString();
      } else {
        // for light backgrounds, make header slightly darker
        headerSurface = bg.clone().darken(6).toHexString();
      }

      // Ensure header text is readable on headerSurface
      let headerText = getContrastingTextColor(headerSurface, 4.5);

      // If contrast is still insufficient, adjust headerSurface until it meets AA
      let attempts = 0;
      while (getContrastRatio(headerSurface, headerText) < 4.5 && attempts < 6) {
        headerSurface = bg.isDark()
          ? tinycolor(headerSurface).lighten(8).toHexString()
          : tinycolor(headerSurface).darken(8).toHexString();
        headerText = getContrastingTextColor(headerSurface, 4.5);
        attempts += 1;
      }

      root.style.setProperty('--brand-surface', headerSurface);
      root.style.setProperty('--brand-header-surface', headerSurface);
      root.style.setProperty('--brand-header-text', headerText);

      // Dev-time accessibility log
      // if (process.env.NODE_ENV !== 'production') {

      //   console.info('Branding accessibility ratios:', {
      //     bg_vs_text: getContrastRatio(branding.colors.background, branding.colors.text),
      //     header_vs_headerText: getContrastRatio(headerSurface, headerText),
      //   });
      // }
    } catch (e) {
      // defensive: ignore in non-browser environments
    }
  }, [branding]);

  const contextValue = useMemo(() => ({
    branding,
    loading: isLoading,
    error: fetchError ? new Error(fetchError.toString()) : null,
    refresh: () => refetch(),
  }), [branding, isLoading, fetchError, refetch]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};