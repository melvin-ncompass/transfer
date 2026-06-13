import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

import { RouterLink } from '../../routes/components';
import { useBranding } from '../../contexts/branding-context';
import type { LogoProps } from '../../types';
import { logoStyles } from '../../styles/components/logo.style';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

/**
 * Application logo component that can be used as a clickable link
 *
 * Features:
 * - SVG-based logo with gradient colors from theme
 * - Clickable link (usually to homepage)
 * - Responsive sizing
 * - Can be disabled for non-clickable scenarios
 *
 * @example
 * ```tsx
 * // In header/navigation
 * <Logo href="/" />
 *
 * // Disabled (non-clickable)
 * <Logo disabled />
 * ```
 */
export function Logo({
  sx,
  disabled,
  className,
  href = '/', // Default link to homepage
  isSingle = true, // Show single icon by default
  collapsed = false,
  ...other
}: LogoProps) {
  const theme = useTheme();
  const { branding } = useBranding();

  // Generate unique ID for SVG gradients to avoid conflicts
  const gradientId = useId();

  // Extract theme colors for the logo gradients
  const TEXT_PRIMARY = theme.vars.palette.text.primary;
  const PRIMARY_LIGHT = theme.vars.palette.primary.light;
  const PRIMARY_MAIN = theme.vars.palette.primary.main;
  const PRIMARY_DARKER = theme.vars.palette.primary.dark;
  
  // Get stroke color from branding (fgcolor or primary color)
  const strokeColor = branding?.fgcolor || branding?.colors?.primary || PRIMARY_MAIN;

  const displayText = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect width="24" height="24" fill="none" />
        <path
          d="M2.5 12h4.5l2.2-4.8 2.4 9.6 2.0-6.3 3.8 0.8H21"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div>CxH Pulse</div>
    </div>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        logoStyles.root(disabled),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* {isSingle ? singleLogo : fullLogo} */}
      <Typography
        variant="h6"
        sx={logoStyles.typography(PRIMARY_MAIN)}
      >
        {displayText}
      </Typography>
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
