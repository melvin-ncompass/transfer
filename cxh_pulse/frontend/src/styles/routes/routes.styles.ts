import type { SxProps, Theme } from '@mui/material/styles';
import { varAlpha } from 'minimal-shared/utils';
import { linearProgressClasses } from '@mui/material/LinearProgress';

/**
 * Routes Component Styles
 * 
 * Extracted sx props for routes component to improve maintainability
 * and enable better code organization.
 */

export const routesStyles: {
  fallbackContainer: SxProps<Theme>;
  fallbackProgress: SxProps<Theme>;
} = {
  /**
   * Fallback container - used for loading states
   */
  fallbackContainer: {
    display: 'flex',
    flex: '1 1 auto',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Linear progress bar - used in fallback loading state
   */
  fallbackProgress: {
    width: 1,
    maxWidth: 320,
    bgcolor: (theme: Theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
    [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
  },
};

