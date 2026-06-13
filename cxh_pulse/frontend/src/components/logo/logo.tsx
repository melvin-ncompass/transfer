import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

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
 * - SVG-based logo with pulse icon + C×H Pulse text (DM Sans) + "by DataKind" stacked text
 * - Special italic styling for the "×" symbol
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

// Logo dimensions - proportional to original SVG (460x70)
const LOGO_HEIGHT = 40;
const LOGO_ASPECT_RATIO = 460 / 70; // ~6.57
const LOGO_WIDTH = LOGO_HEIGHT * LOGO_ASPECT_RATIO;

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

  // Get color from branding (fgcolor or primary color)
  const logoColor = branding?.fgcolor || branding?.colors?.primary || theme.vars.palette.primary.main;

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="CxH Pulse Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        logoStyles.root(disabled),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        viewBox="0 0 460 70"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Heartbeat / pulse symbol (optically centered) */}
        <path
          d="M16 36 L24 36 L30 26 L36 46 L42 32 L48 36 L58 36"
          fill="none"
          stroke={logoColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Main brand text "C" */}
        <text
          x="70"
          y="46"
          fontFamily="DM Sans Variable, Barlow, sans-serif"
          fontWeight="600"
          fill={logoColor}
          fontSize="40"
          style={{ letterSpacing: '-1.5px' }}
        >
          C
        </text>
        {/* Special "x" symbol */}
        <text
          x="99"
          y="43"
          fontFamily="DM Sans Variable, Barlow, sans-serif"
          fontWeight="700"
          fill={logoColor}
          fontSize="32"
        >
          x
        </text>
        {/* Main brand text "H Pulse" */}
        <text
          x="120"
          y="46"
          fontFamily="DM Sans Variable, Barlow, sans-serif"
          fontWeight="600"
          fill={logoColor}
          fontSize="40"
          style={{ letterSpacing: '-1.5px' }}
        >
          H Pulse
        </text>
        {/* Side stacked text - "by" */}
        <text
          x="268"
          y="26"
          fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
          fontWeight="500"
          fill={logoColor}
          fontSize="12"
        >
          by
        </text>
        {/* Side stacked text - "DataKind®" (thicker and taller) */}
        <text
          x="268"
          y="46"
          fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
          fontWeight="800"
          fill={logoColor}
          fontSize="15.5"
          style={{ letterSpacing: '-0.3px' }}
        >
          DataKind
          <tspan dx="1" dy="-6" fontSize="9" baselineShift="super">®</tspan>
        </text>
      </svg>
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
