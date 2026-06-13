// src/theme/generateTheme.ts
import { createTheme } from '@mui/material/styles';
import { Branding } from '../types';
import { baseTheme } from './create-theme';
import { lighten as lightenColor, darken as darkenColor } from '@mui/system/colorManipulator';
import { getContrastingTextColor } from '../utils/color';

export const generateTheme = (branding: Branding) =>
  createTheme({
    ...baseTheme,
    colorSchemes: {
      light: {
        ...(baseTheme.colorSchemes?.light || {}),
        palette: {
          ...(baseTheme.colorSchemes?.light?.palette || {}),
          primary: {
            ...(baseTheme.colorSchemes?.light?.palette?.primary || {}),
            // Primary (accent) should come from branding.colors.primary (10%)
            main: branding?.colors?.primary || branding.fgcolor || '#1976d2',
            light: lightenColor(branding?.colors?.primary || branding.fgcolor || '#1976d2', 0.2),
            dark: darkenColor(branding?.colors?.primary || branding.fgcolor || '#1976d2', 0.2),
            contrastText: getContrastingTextColor(branding?.colors?.primary || branding.fgcolor || '#1976d2'),
          },
          secondary: {
            ...(baseTheme.colorSchemes?.light?.palette?.secondary || {}),
            main: branding?.colors?.secondary || '#1565C0',
            light: lightenColor(branding?.colors?.secondary || '#1565C0', 0.2),
            dark: darkenColor(branding?.colors?.secondary || '#1565C0', 0.2),
            contrastText: getContrastingTextColor(branding?.colors?.secondary || '#1565C0'),
          },
          background: {
            ...(baseTheme.colorSchemes?.light?.palette?.background || {}),
            // Background (30%) comes from branding.colors.background
            default: branding?.colors?.background || branding.bgcolor || '#ffffff',
            paper: branding?.colors?.background || branding.bgcolor || '#ffffff',
          },
          text: {
            ...(baseTheme.colorSchemes?.light?.palette?.text || {}),
            // Text (60%) should be a readable color against the background
            primary: branding?.colors?.text || getContrastingTextColor(branding?.colors?.background || branding.bgcolor || '#ffffff'),
            secondary: lightenColor(branding?.colors?.text || 'rgba(0,0,0,0.6)', 0.3),
            disabled: lightenColor(branding?.colors?.text || 'rgba(0,0,0,0.38)', 0.5),
          },
        },
      },
    },
    typography: {
      ...(typeof baseTheme.typography === 'function'
        ? baseTheme.typography({} as any)
        : baseTheme.typography || {}),
      fontFamily:
        branding.typography?.fontFamily ||
        (typeof baseTheme.typography === 'function'
          ? baseTheme.typography({} as any).fontFamily
          : baseTheme.typography?.fontFamily),
    },
    components: {
      ...(typeof baseTheme.components === 'object' && baseTheme.components !== null
        ? baseTheme.components
        : {}),
      MuiCssBaseline: {
        styleOverrides: {
          ...(typeof baseTheme.components?.MuiCssBaseline?.styleOverrides === 'object' &&
            baseTheme.components?.MuiCssBaseline?.styleOverrides !== null
            ? baseTheme.components.MuiCssBaseline.styleOverrides
            : {}),
          body: {
            backgroundColor: branding.bgcolor || '#ffffff',
            color: branding.fgcolor || 'rgba(0, 0, 0, 0.87)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
          containedPrimary: {
            backgroundColor: 'var(--brand-accent)',
            color: 'var(--brand-accent-contrast)',
            '&:hover': { filter: 'brightness(0.95)' },
          },
          outlinedPrimary: {
            borderColor: 'var(--brand-accent)',
            color: 'var(--brand-accent)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          },
          textPrimary: {
            color: 'var(--brand-accent)',
          },
          containedSecondary: {
            backgroundColor: 'var(--brand-secondary)',
            color: 'var(--brand-secondary-contrast)'
          },
          outlinedSecondary: {
            borderColor: 'var(--brand-secondary)',
            color: 'var(--brand-secondary)'
          },
          textSecondary: {
            color: 'var(--brand-secondary)'
          },
          containedSuccess: {
            backgroundColor: 'var(--brand-success)',
            color: 'var(--brand-success-contrast)'
          },
          containedWarning: {
            backgroundColor: 'var(--brand-warning)',
            color: 'var(--brand-warning-contrast)'
          },
          containedError: {
            backgroundColor: 'var(--brand-error)',
            color: 'var(--brand-error-contrast)'
          },
        },
      },
    },
  });
